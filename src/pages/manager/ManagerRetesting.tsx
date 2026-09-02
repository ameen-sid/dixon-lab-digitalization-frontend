import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clipboard, AlertTriangle, X, Search, ChevronRight, RotateCcw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

import Pagination from '../../components/Pagination';
import CustomSelect from '../../components/CustomSelect';

import { getTestTypes } from '../../services/operations/testTypeService';
import { getTestCategories } from '../../services/operations/testCategoryService';
import { getTestProtocols } from '../../services/operations/testProtocolService';
import { getTestingEquipments, reserveEquipment, releaseEquipment } from '../../services/operations/testingEquipmentService';
import { reservePlatforms as reserveNormalPlatforms, releasePlatforms as releaseNormalPlatforms } from '../../services/operations/platformAvailabilityService';
import { reservePlatforms as reserveNablPlatforms, releasePlatforms as releaseNablPlatforms } from '../../services/operations/nablStationAvailabilityService';

interface ManagerRetestingProps {
    requests: any[];
    selectedRequestId?: string;
    onUpdateStatus?: (id: string, status: string, remarks?: string) => Promise<any>;
    onRefreshRequests?: () => Promise<void>;
}

interface TestPlanForm {
    id?: number;
    parentPlanId?: number;
    testTypeId: string;
    testCategoryId: string;
    productType: string;
    stationNo: number;
    platformNos: number[];
    testProtocolId: string;
    referenceStandard: string;
    numberOfDays: number;
    startDate: string;
    endDate: string;
    remarks: string;
    equipmentId: string;
    evaluationStatus?: 'PASSED' | 'FAILED';
    evaluationRemarks?: string;
}

const getLocalTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const toYYYYMMDD = (dateVal: any): string => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
        const str = dateVal.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
            return str;
        }
        if (str.includes('T')) {
            return str.split('T')[0];
        }
        if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(str)) {
            const parts = str.split(/[-/]/);
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const calculateEndDate = (startDateStr: string, numDays: number | string): string => {
    const formattedStart = toYYYYMMDD(startDateStr);
    const days = Number(numDays);
    if (!formattedStart || isNaN(days) || days <= 0) return '';
    const [y, m, d] = formattedStart.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return '';
    date.setDate(date.getDate() + days - 1);
    const resY = date.getFullYear();
    const resM = String(date.getMonth() + 1).padStart(2, '0');
    const resD = String(date.getDate()).padStart(2, '0');
    return `${resY}-${resM}-${resD}`;
};

export default function ManagerRetesting({ requests, selectedRequestId, onRefreshRequests }: ManagerRetestingProps) {
    const navigate = useNavigate();
    const location = useLocation();

    // Construct flat list of test plans returned for retesting
    const retestPlansList = useMemo(() => {
        const list: { request: any; plan: any; sampleIndex: number }[] = [];
        const seenKeys = new Set<string>();

        for (const req of requests) {
            const plans = req.testPlans || [];

            // Helper to find root parent plan ID
            const getRootParentId = (p: any) => {
                let curr = p;
                while (curr && curr.parentPlanId) {
                    const parent = plans.find((x: any) => Number(x.id) === Number(curr.parentPlanId));
                    if (!parent) break;
                    curr = parent;
                }
                return Number(curr.id);
            };

            // Group plans by test lineage (key: root parent plan ID)
            const groupedPlansMap = new Map<number, any[]>();
            plans.forEach((p: any) => {
                const evalRemarks = p.evaluationRemarks || '';
                const isHeadRetest = p.headAction === 'RETURNED_TO_TESTING' ||
                    evalRemarks.includes('[HEAD_ACTION:RETURNED_TO_TESTING]') ||
                    Boolean(p.parentPlanId);

                const isReturnedToRequester = p.headAction === 'RETURNED_TO_REQUESTER' || evalRemarks.includes('[HEAD_ACTION:RETURNED_TO_REQUESTER]');
                const isReturnedToManagerCapa = p.headAction === 'RETURNED_TO_LAB_MANAGER' || evalRemarks.includes('[HEAD_ACTION:RETURNED_TO_LAB_MANAGER]');

                if (isHeadRetest && !isReturnedToRequester && !isReturnedToManagerCapa) {
                    const lineageKey = getRootParentId(p);
                    if (!groupedPlansMap.has(lineageKey)) {
                        groupedPlansMap.set(lineageKey, []);
                    }
                    groupedPlansMap.get(lineageKey)!.push(p);
                }
            });

            groupedPlansMap.forEach((lineagePlans) => {
                // Find child retest plan (or latest child retest plan), otherwise the root plan
                const childPlans = lineagePlans.filter((p: any) => Boolean(p.parentPlanId));
                const activePlan = childPlans.length > 0 ? childPlans[childPlans.length - 1] : lineagePlans[0];
                const rootId = getRootParentId(activePlan);
                const key = `${req.id}-${rootId}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    list.push({
                        request: req,
                        plan: activePlan,
                        sampleIndex: activePlan.sampleIndex ?? 0
                    });
                }
            });
        }
        return list;
    }, [requests]);

    const selectedReq = selectedRequestId
        ? requests.find(r => String(r.id) === String(selectedRequestId))
        : null;

    const [activeSampleIndex, setActiveSampleIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const [testTypes, setTestTypes] = useState<any[]>([]);
    const [testCategories, setTestCategories] = useState<any[]>([]);
    const [testProtocols, setTestProtocols] = useState<any[]>([]);
    const [equipments, setEquipments] = useState<any[]>([]);

    const savedPlans = useMemo(() => {
        const plansMap: { [key: string]: any[] } = {};
        for (const req of requests) {
            if (req.testPlans) {
                for (const p of req.testPlans) {
                    let platformNosParsed: number[] = [];
                    if (p.platformNos) {
                        try {
                            const parsed = typeof p.platformNos === 'string' ? JSON.parse(p.platformNos) : p.platformNos;
                            platformNosParsed = (Array.isArray(parsed) ? parsed : [parsed]).map(Number).filter(n => !isNaN(n));
                        } catch (e) {
                            platformNosParsed = [];
                        }
                    }
                    const key = `${req.id}-sample-${p.sampleIndex}`;
                    if (!plansMap[key]) plansMap[key] = [];
                    plansMap[key].push({
                        id: p.id,
                        testTypeId: String(p.testTypeId || p.testType?.id || ''),
                        testCategoryId: String(p.testCategoryId || p.testCategory?.id || ''),
                        productType: p.productType || 'FATL',
                        stationNo: p.stationNo || 1,
                        platformNos: platformNosParsed,
                        testProtocolId: String(p.testProtocolId || p.testProtocol?.id || ''),
                        referenceStandard: p.referenceStandard || '',
                        numberOfDays: p.numberOfDays || 9,
                        startDate: p.startDate ? toYYYYMMDD(p.startDate) : '',
                        endDate: p.endDate ? toYYYYMMDD(p.endDate) : (p.startDate ? calculateEndDate(p.startDate, p.numberOfDays) : ''),
                        remarks: p.remarks || '',
                        equipmentId: String(p.equipmentId || ''),
                        evaluationStatus: p.evaluationStatus || undefined,
                        evaluationRemarks: p.evaluationRemarks || undefined,
                        headAction: p.headAction,
                        parentPlanId: p.parentPlanId ? Number(p.parentPlanId) : undefined
                    });
                }
            }
        }
        return plansMap;
    }, [requests]);

    const [form, setForm] = useState<TestPlanForm>({
        testTypeId: '',
        testCategoryId: '',
        productType: 'FATL',
        stationNo: 1,
        platformNos: [],
        testProtocolId: '',
        referenceStandard: '',
        numberOfDays: 9,
        startDate: getLocalTodayStr(),
        endDate: '',
        remarks: '',
        equipmentId: ''
    });

    // Calculate occupied station-platform pairs across all requests (excluding current plan being edited)
    const occupiedPlatformMap = useMemo(() => {
        const map = new Map<string, string>(); // "stationNo-platformNo" -> Request ID / Plan Name
        for (const req of requests) {
            // Ignore requests that are completed, rejected, or finalized
            if (['COMPLETED', 'REJECTED', 'FAILED'].includes((req.status || '').toUpperCase())) continue;

            const plans = req.testPlans || [];
            for (const p of plans) {
                if (form.id && Number(p.id) === Number(form.id)) continue;
                if (form.parentPlanId && (Number(p.parentPlanId) === Number(form.parentPlanId) || Number(p.id) === Number(form.parentPlanId))) continue;
                if (form.id && Number(p.parentPlanId) === Number(form.id)) continue;
                // Ignore plans that are already evaluated (PASSED or FAILED)
                const isEvaluated = ['PASSED', 'FAILED'].includes((p.evaluationStatus || '').toUpperCase());
                if (isEvaluated) continue;

                if (p.stationNo) {
                    let platformNos: number[] = [];
                    if (p.platformNos) {
                        try {
                            const parsed = typeof p.platformNos === 'string' ? JSON.parse(p.platformNos) : p.platformNos;
                            platformNos = (Array.isArray(parsed) ? parsed : [parsed]).map(Number).filter(n => !isNaN(n));
                        } catch {
                            if (typeof p.platformNos === 'string') {
                                platformNos = p.platformNos.split(',').map((s: string) => Number(s.trim())).filter((n: number) => !isNaN(n));
                            } else if (typeof p.platformNos === 'number') {
                                platformNos = [p.platformNos];
                            }
                        }
                    }
                    const reqIdStr = req.requestId || `REQ-${req.id}`;
                    for (const pNum of platformNos) {
                        map.set(`${p.stationNo}-${pNum}`, `${reqIdStr} (${p.testType?.name || 'Occupied'})`);
                    }
                }
            }
        }
        return map;
    }, [requests, form.id, form.parentPlanId]);

    // Calculate occupied equipment IDs across all active requests
    const occupiedEquipmentIds = useMemo(() => {
        const set = new Set<string>();
        for (const req of requests) {
            // Ignore requests that are completed, rejected, or finalized
            if (['COMPLETED', 'REJECTED', 'FAILED'].includes((req.status || '').toUpperCase())) continue;

            const plans = req.testPlans || [];
            for (const p of plans) {
                if (form.id && Number(p.id) === Number(form.id)) continue;
                if (form.parentPlanId && (Number(p.parentPlanId) === Number(form.parentPlanId) || Number(p.id) === Number(form.parentPlanId))) continue;
                if (form.id && Number(p.parentPlanId) === Number(form.id)) continue;
                // Ignore plans that are already evaluated (PASSED or FAILED)
                const isEvaluated = ['PASSED', 'FAILED'].includes((p.evaluationStatus || '').toUpperCase());
                if (isEvaluated) continue;

                if (p.equipmentId) {
                    set.add(String(p.equipmentId));
                }
            }
        }
        return set;
    }, [requests, form.id, form.parentPlanId]);

    const isReliability = testTypes.find(t => String(t.id) === String(form.testTypeId))?.name?.toLowerCase().includes('reliability') || false;

    const loadDbOptions = async () => {
        try {
            const types = await getTestTypes()();
            const categories = await getTestCategories()();
            const protocols = await getTestProtocols()();
            const eqps = await getTestingEquipments({ limit: 100 })();

            setTestTypes(types || []);
            setTestCategories(categories || []);
            setTestProtocols(protocols || []);
            setEquipments(eqps || []);
        } catch (err) {
            console.error('Failed to load database options:', err);
        }
    };

    useEffect(() => {
        loadDbOptions();
    }, []);

    const formatDateToDMY = (dateStr: string) => {
        if (!dateStr) return '';
        const ymd = toYYYYMMDD(dateStr);
        if (!ymd) return dateStr;
        const [year, month, day] = ymd.split('-');
        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        if (!form.startDate || !form.numberOfDays) {
            setForm(prev => (prev.endDate ? { ...prev, endDate: '' } : prev));
            return;
        }
        const calculatedStr = calculateEndDate(form.startDate, form.numberOfDays);
        setForm(prev => (prev.endDate !== calculatedStr ? { ...prev, endDate: calculatedStr } : prev));
    }, [form.startDate, form.numberOfDays]);

    const handleTestTypeChange = (typeId: string) => {
        const filteredCats = testCategories.filter(c => String(c.testTypeId) === String(typeId));
        const firstCat = filteredCats[0] || null;
        const catId = firstCat ? String(firstCat.id) : '';

        const filteredProtos = testProtocols.filter(
            p => String(p.testCategoryId) === String(catId) &&
                String(p.productType).toLowerCase() === String(form.productType).toLowerCase()
        );
        const firstProto = filteredProtos[0] || null;
        const protoId = firstProto ? String(firstProto.id) : '';

        setForm(prev => ({
            ...prev,
            testTypeId: typeId,
            testCategoryId: catId,
            testProtocolId: protoId
        }));
    };

    const handleTestCategoryChange = (catId: string) => {
        const filteredProtos = testProtocols.filter(
            p => String(p.testCategoryId) === String(catId) &&
                String(p.productType).toLowerCase() === String(form.productType).toLowerCase()
        );
        const firstProto = filteredProtos[0] || null;
        const protoId = firstProto ? String(firstProto.id) : '';

        setForm(prev => ({
            ...prev,
            testCategoryId: catId,
            testProtocolId: protoId
        }));
    };

    const handleProductTypeChange = (pType: string) => {
        const filteredProtos = testProtocols.filter(
            p => String(p.testCategoryId) === String(form.testCategoryId) &&
                String(p.productType).toLowerCase() === String(pType).toLowerCase()
        );
        const firstProto = filteredProtos[0] || null;
        const protoId = firstProto ? String(firstProto.id) : '';

        setForm(prev => ({
            ...prev,
            productType: pType,
            testProtocolId: protoId
        }));
    };

    const handleOpenPlanForm = async (sampleIndex: number, planToEdit?: any) => {
        if (!selectedReq) return;
        setActiveSampleIndex(sampleIndex);

        if (planToEdit) {
            const initialStart = getLocalTodayStr();
            const initialNumDays = Number(planToEdit.numberOfDays) || 9;
            const initialEnd = calculateEndDate(initialStart, initialNumDays);

            const tId = String(planToEdit.testTypeId || planToEdit.testType?.id || '');
            const cId = String(planToEdit.testCategoryId || planToEdit.testCategory?.id || '');
            const pId = String(planToEdit.testProtocolId || planToEdit.testProtocol?.id || '');

            const isChildRetest = Boolean(planToEdit.parentPlanId);

            let initialPlatformNos: number[] = [];
            if (planToEdit.platformNos) {
                if (Array.isArray(planToEdit.platformNos)) {
                    initialPlatformNos = planToEdit.platformNos.map(Number).filter((n: number) => !isNaN(n));
                } else if (typeof planToEdit.platformNos === 'string') {
                    try {
                        const parsed = JSON.parse(planToEdit.platformNos);
                        initialPlatformNos = (Array.isArray(parsed) ? parsed : [parsed]).map(Number).filter((n: number) => !isNaN(n));
                    } catch {
                        initialPlatformNos = planToEdit.platformNos.split(',').map((s: string) => Number(s.trim())).filter((n: number) => !isNaN(n));
                    }
                } else if (typeof planToEdit.platformNos === 'number') {
                    initialPlatformNos = [planToEdit.platformNos];
                }
            }

            setForm({
                id: isChildRetest ? Number(planToEdit.id) : undefined,
                parentPlanId: isChildRetest ? Number(planToEdit.parentPlanId) : Number(planToEdit.id),
                testTypeId: tId,
                testCategoryId: cId,
                productType: planToEdit.productType || 'FATL',
                stationNo: Number(planToEdit.stationNo) || 1,
                platformNos: initialPlatformNos,
                testProtocolId: pId,
                referenceStandard: planToEdit.referenceStandard || '',
                numberOfDays: initialNumDays,
                startDate: initialStart,
                endDate: initialEnd,
                remarks: planToEdit.remarks || '',
                equipmentId: planToEdit.equipmentId ? String(planToEdit.equipmentId) : '',
                evaluationStatus: undefined,
                evaluationRemarks: undefined
            });
        } else {
            const defaultEq = equipments.find((e: any) => {
                const isMaint = ['maintenance', 'under_maintenance'].includes(String(e.status || '').toLowerCase());
                return !isMaint && (e.isAvailable === true || String(e.status || '').toUpperCase() === 'ACTIVE' || String(e.status || '').toUpperCase() === 'AVAILABLE');
            });
            const defaultStart = getLocalTodayStr();
            const defaultNumDays = 9;
            const defaultEnd = calculateEndDate(defaultStart, defaultNumDays);

            setForm({
                testTypeId: '',
                testCategoryId: '',
                productType: 'FATL',
                stationNo: 1,
                platformNos: [],
                testProtocolId: '',
                referenceStandard: '',
                numberOfDays: defaultNumDays,
                startDate: defaultStart,
                endDate: defaultEnd,
                remarks: '',
                equipmentId: defaultEq ? String(defaultEq.id) : ''
            });
        }
    };

    const handleSaveTestPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReq || activeSampleIndex === null) return;

        if (!form.testTypeId) {
            toast.error('Please select a Test Type.');
            return;
        }

        if (!form.numberOfDays || Number(form.numberOfDays) <= 0) {
            toast.error('Number of Days must be a positive number.');
            return;
        }

        let finalEndDate = form.endDate || calculateEndDate(form.startDate, form.numberOfDays);
        if (!finalEndDate) {
            toast.error('Could not compute end date.');
            return;
        }

        try {
            const reqIdPrefix = (selectedReq.requestId && String(selectedReq.requestId).startsWith('REQ-'))
                ? selectedReq.requestId
                : `REQ-${selectedReq.requestId || selectedReq.id}`;

            const isNabl = testTypes.find(t => String(t.id) === String(form.testTypeId))?.name?.toLowerCase().includes('nabl') || false;

            // Release previously reserved platforms / equipment if re-configuring or editing
            const rootParentTarget = form.parentPlanId ? Number(form.parentPlanId) : (form.id ? Number(form.id) : null);
            const existingPlansToRelease = (selectedReq.testPlans || []).filter((p: any) => {
                if (form.id && Number(p.id) === Number(form.id)) return true;
                if (rootParentTarget && (Number(p.parentPlanId) === rootParentTarget || Number(p.id) === rootParentTarget) && p.evaluationStatus === null) return true;
                return false;
            });

            for (const existingPlan of existingPlansToRelease) {
                if (existingPlan.platformNos) {
                    const prevPlats = Array.isArray(existingPlan.platformNos)
                        ? existingPlan.platformNos
                        : (typeof existingPlan.platformNos === 'string' ? JSON.parse(existingPlan.platformNos || '[]') : []);
                    if (prevPlats.length > 0) {
                        const existingIsNabl = testTypes.find(t => String(t.id) === String(existingPlan.testTypeId))?.name?.toLowerCase().includes('nabl') || false;
                        const relOp = existingIsNabl
                            ? releaseNablPlatforms(Number(existingPlan.stationNo || 1), prevPlats.map(Number))
                            : releaseNormalPlatforms(Number(existingPlan.stationNo || 1), prevPlats.map(Number));
                        await relOp();
                    }
                }
                if (existingPlan.equipmentId) {
                    const relEqOp = releaseEquipment(Number(existingPlan.equipmentId));
                    await relEqOp();
                }
            }

            if (form.platformNos && form.platformNos.length > 0) {
                const resOp = isNabl
                    ? reserveNablPlatforms(
                        Number(form.stationNo),
                        form.platformNos.map(Number),
                        Number(selectedReq.id),
                        `${reqIdPrefix} (Sample #${activeSampleIndex + 1} Retest)`,
                        selectedReq.modelNo || '-',
                        finalEndDate
                    )
                    : reserveNormalPlatforms(
                        Number(form.stationNo),
                        form.platformNos.map(Number),
                        Number(selectedReq.id),
                        `${reqIdPrefix} (Sample #${activeSampleIndex + 1} Retest)`,
                        selectedReq.modelNo || '-',
                        finalEndDate
                    );
                await resOp();
            }

            if (form.equipmentId && !isReliability) {
                const eqResOp = reserveEquipment(
                    Number(form.equipmentId),
                    Number(selectedReq.id),
                    `${reqIdPrefix} (Sample #${activeSampleIndex + 1} Retest)`,
                    selectedReq.modelNo || '-',
                    finalEndDate
                );
                await eqResOp();
            }

            const testPlanData = {
                id: form.id ? Number(form.id) : undefined,
                parentPlanId: form.parentPlanId ? Number(form.parentPlanId) : undefined,
                isRetest: true,
                sampleIndex: activeSampleIndex,
                testTypeId: Number(form.testTypeId),
                testCategoryId: form.testCategoryId ? Number(form.testCategoryId) : null,
                testProtocolId: form.testProtocolId ? Number(form.testProtocolId) : null,
                productType: form.productType,
                stationNo: Number(form.stationNo || 1),
                platformNos: form.platformNos || [],
                equipmentId: (form.equipmentId && !isReliability) ? Number(form.equipmentId) : null,
                referenceStandard: form.referenceStandard || null,
                numberOfDays: Number(form.numberOfDays),
                startDate: form.startDate,
                endDate: finalEndDate,
                remarks: form.remarks,
                headAction: 'RETURNED_TO_TESTING',
                evaluationStatus: null,
                evaluationRemarks: '[HEAD_ACTION:RETURNED_TO_TESTING]'
            };

            const planRes = await fetch(`/api/v1/test-requests/${selectedReq.id}/test-plans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(testPlanData)
            });

            if (!planRes.ok) {
                throw new Error('Failed to save test plan for retesting');
            }

            if (onRefreshRequests) {
                await onRefreshRequests();
            }

            toast.success(`Retest plan for Sample #${activeSampleIndex + 1} created and configured!`);
            setActiveSampleIndex(null);
        } catch (error) {
            console.error('Failed to configure retest plan:', error);
            toast.error('Failed to reserve required platform or equipment resources for retest.');
        }
    };

    const filteredRetestPlans = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();

        return retestPlansList.filter(({ request, plan }) => {
            const reqId = (request.requestId || `REQ-${request.id}`).toLowerCase();
            const brand = (request.brandName || '').toLowerCase();
            const model = (request.modelNo || '').toLowerCase();
            const sampleDesc = (request.sampleDescription || '').toLowerCase();
            const planTestType = (plan?.testType?.name || '').toLowerCase();

            const matchesSearch = !q || reqId.includes(q) || brand.includes(q) || model.includes(q) || sampleDesc.includes(q) || planTestType.includes(q);
            if (!matchesSearch) return false;

            // Retest plan status check
            const childPlan = (request.testPlans || []).find((p: any) => Number(p.parentPlanId) === Number(plan.id)) || (plan.parentPlanId ? plan : null);
            const isConfigured = Boolean(childPlan);
            const isEvaluated = Boolean(childPlan && ['PASSED', 'FAILED'].includes((childPlan.evaluationStatus || '').toUpperCase()));

            if (statusFilter === 'PENDING_CONFIG' && isConfigured) {
                return false;
            }
            if (statusFilter === 'PENDING_EVALUATION' && (!isConfigured || isEvaluated)) {
                return false;
            }
            if (statusFilter === 'EVALUATED' && !isEvaluated) {
                return false;
            }

            // Date filtering
            let matchesDate = true;
            const itemDate = toYYYYMMDD(plan.updatedAt || plan.startDate || request.updatedAt || request.createdAt);
            if (startDate && itemDate) {
                matchesDate = matchesDate && itemDate >= startDate;
            }
            if (endDate && itemDate) {
                matchesDate = matchesDate && itemDate <= endDate;
            }

            return matchesDate;
        });
    }, [retestPlansList, searchQuery, statusFilter, startDate, endDate]);

    const maxPage = Math.ceil(filteredRetestPlans.length / itemsPerPage);
    const activePage = maxPage > 0 ? Math.min(currentPage, maxPage) : 1;
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginatedRetestPlans = filteredRetestPlans.slice(startIndex, startIndex + itemsPerPage);

    // Determine single plan or filtered retest plans to show on Retesting Details page
    const retestPlansToDisplay = useMemo(() => {
        if (!selectedReq) return [];
        const searchParams = new URLSearchParams(location.search);
        const targetPlanId = searchParams.get('planId');
        const plans = selectedReq.testPlans || [];

        if (targetPlanId) {
            const getRootId = (p: any) => {
                let curr = p;
                while (curr && curr.parentPlanId) {
                    const parent = plans.find((x: any) => Number(x.id) === Number(curr.parentPlanId));
                    if (!parent) break;
                    curr = parent;
                }
                return Number(curr.id);
            };
            const target = plans.find((p: any) => String(p.id) === String(targetPlanId));
            if (target) {
                const rootId = getRootId(target);
                const lineagePlans = plans.filter((p: any) => getRootId(p) === rootId);
                const childPlans = lineagePlans.filter((p: any) => Boolean(p.parentPlanId));
                const activePlan = childPlans.length > 0 ? childPlans[childPlans.length - 1] : lineagePlans[0];
                return [activePlan];
            }
        }

        const filtered = plans.filter((p: any) => {
            const evalRemarks = p.evaluationRemarks || '';
            const isHeadRetest = p.headAction === 'RETURNED_TO_TESTING' ||
                evalRemarks.includes('[HEAD_ACTION:RETURNED_TO_TESTING]') ||
                Boolean(p.parentPlanId);
            const isReturnedToRequester = p.headAction === 'RETURNED_TO_REQUESTER' || evalRemarks.includes('[HEAD_ACTION:RETURNED_TO_REQUESTER]');
            const isReturnedToManagerCapa = p.headAction === 'RETURNED_TO_LAB_MANAGER' || evalRemarks.includes('[HEAD_ACTION:RETURNED_TO_LAB_MANAGER]');

            return isHeadRetest && !isReturnedToRequester && !isReturnedToManagerCapa;
        });

        const getRootParentId = (p: any) => {
            let curr = p;
            while (curr && curr.parentPlanId) {
                const parent = plans.find((x: any) => Number(x.id) === Number(curr.parentPlanId));
                if (!parent) break;
                curr = parent;
            }
            return Number(curr.id);
        };

        const groupedMap = new Map<number, any[]>();
        filtered.forEach((p: any) => {
            const lineageKey = getRootParentId(p);
            if (!groupedMap.has(lineageKey)) {
                groupedMap.set(lineageKey, []);
            }
            groupedMap.get(lineageKey)!.push(p);
        });

        const collapsed: any[] = [];
        groupedMap.forEach((lineagePlans) => {
            const childPlans = lineagePlans.filter((p: any) => Boolean(p.parentPlanId));
            const activePlan = childPlans.length > 0 ? childPlans[childPlans.length - 1] : lineagePlans[0];
            collapsed.push(activePlan);
        });

        return collapsed;
    }, [selectedReq, location.search]);

    return (
        <div className="space-y-6">
            {!selectedReq ? (
                <div className="space-y-6">
                    <div className="bg-white border border-zinc-200/50 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="flex flex-col md:flex-row gap-3 flex-1 flex-wrap">
                            <div className="relative flex-1 min-w-[220px]">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Search by Request ID, brand, model, sample or test type..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none focus:bg-white focus:border-[#11236a] transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setCurrentPage(1);
                                        }}
                                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-red-500 bg-transparent border-none cursor-pointer outline-none"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <CustomSelect
                                value={statusFilter}
                                onChange={(val) => {
                                    setStatusFilter(val);
                                    setCurrentPage(1);
                                }}
                                options={[
                                    { value: 'ALL', label: 'All Retest Statuses' },
                                    { value: 'PENDING_CONFIG', label: 'Pending Configuration' },
                                    { value: 'PENDING_EVALUATION', label: 'Pending Evaluation' },
                                    { value: 'EVALUATED', label: 'Evaluated' }
                                ]}
                                className="w-52 shrink-0"
                            />

                            <div className="flex items-center gap-2 bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1">
                                <span className="text-[9px] font-extrabold text-zinc-700 uppercase tracking-wider">From</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent border-none text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
                                />
                            </div>

                            <div className="flex items-center gap-2 bg-[#f8fafc] border border-zinc-200 rounded-xl px-3 py-1">
                                <span className="text-[9px] font-extrabold text-zinc-700 uppercase tracking-wider">To</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="bg-transparent border-none text-xs font-semibold text-zinc-700 outline-none cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {(searchQuery || statusFilter !== 'ALL' || startDate || endDate) && (
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('ALL');
                                        setStartDate('');
                                        setEndDate('');
                                        setCurrentPage(1);
                                    }}
                                    className="text-xs font-bold text-red-650 hover:text-red-755 hover:underline bg-transparent border-none cursor-pointer text-left mr-2"
                                >
                                    Reset Filters
                                </button>
                            )}
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">{filteredRetestPlans.length} retest plans found</span>
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200/50 rounded-2xl shadow-sm overflow-hidden">
                        {filteredRetestPlans.length === 0 ? (
                            <div className="p-12 text-center space-y-3">
                                <RotateCcw className="w-10 h-10 text-zinc-300 mx-auto" />
                                <p className="text-sm font-bold text-zinc-700">No Test Plans Match Filter</p>
                                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                                    No retest test plans match the selected status or date criteria. Try adjusting your filters.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">
                                            <th className="py-3 px-4">Request ID</th>
                                            <th className="py-3 px-4">Sample & Test Plan</th>
                                            <th className="py-3 px-4">Brand & Model</th>
                                            <th className="py-3 px-4">Sample Description</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 text-xs font-semibold">
                                        {paginatedRetestPlans.map(({ request, plan, sampleIndex }, idx) => {
                                            const cleanRemarks = (plan?.evaluationRemarks || '').replace(/\[HEAD_ACTION:[^\]]+\]/g, '').trim();
                                            const childPlan = (request.testPlans || []).find((p: any) => Number(p.parentPlanId) === Number(plan.id)) || (plan.parentPlanId ? plan : null);
                                            const isConfigured = Boolean(childPlan);
                                            const isEvaluated = Boolean(childPlan && ['PASSED', 'FAILED'].includes((childPlan.evaluationStatus || '').toUpperCase()));

                                            return (
                                                <tr key={`${request.id}-${plan?.id || idx}`} className="hover:bg-zinc-50/60 transition-colors group">
                                                    <td className="py-3.5 px-4 font-bold text-[#11236a]">
                                                        {request.requestId || `REQ-${request.id}`}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-zinc-800">
                                                        <div className="font-bold text-[#11236a]">
                                                            Sample #{sampleIndex + 1}
                                                        </div>
                                                        <div className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 inline-block mt-0.5">
                                                            {plan?.testType?.name || 'Failed Test Plan'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-zinc-800">
                                                        <div className="font-bold">{request.brandName}</div>
                                                        <div className="text-[10px] text-zinc-500">{request.modelNo}</div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-zinc-600 max-w-xs truncate">
                                                        {request.sampleDescription}
                                                        {cleanRemarks && (
                                                            <div className="text-[10px] text-amber-700 font-normal italic truncate">
                                                                Remarks: {cleanRemarks}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        {isEvaluated ? (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                                                                Retest Evaluated
                                                            </span>
                                                        ) : isConfigured ? (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                                                                Retest Configured
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 uppercase">
                                                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                                                Retest Authorized
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                const planIdQuery = plan?.id ? `?planId=${plan.id}` : '';
                                                                navigate(`/manager/retesting/${request.id}${planIdQuery}`);
                                                            }}
                                                            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm active:scale-95"
                                                        >
                                                            <span>{isEvaluated ? 'View Details' : 'Reconfigure & Retest'}</span>
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <Pagination
                                    totalItems={filteredRetestPlans.length}
                                    itemsPerPage={itemsPerPage}
                                    currentPage={currentPage}
                                    onPageChange={setCurrentPage}
                                    onItemsPerPageChange={(limit) => {
                                        setItemsPerPage(limit);
                                        setCurrentPage(1);
                                    }}
                                    itemNamePlural="retest plans"
                                />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/manager/retesting')}
                            className="w-9 h-9 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-zinc-555 hover:text-zinc-800 hover:shadow-sm transition-all cursor-pointer outline-none"
                        >
                            <ArrowLeft className="w-4 h-4 shrink-0" />
                        </button>
                        <div>
                            <h3 className="text-base font-extrabold text-zinc-900 tracking-tight leading-none">
                                Reconfigure Retest: {selectedReq.requestId || `REQ-${selectedReq.id}`}
                            </h3>
                            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                                {selectedReq.brandName} • {selectedReq.modelNo}
                            </span>
                        </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Retest Allocation Required</h4>
                            <p className="text-xs text-amber-700 mt-0.5">
                                Head of Lab has returned this failed plan for retesting. Reconfigure the test dates and station resources to restart testing.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border border-zinc-200/50 rounded-2xl p-6 shadow-sm space-y-6">
                        <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider border-b border-zinc-100 pb-3">
                            Sample Test Plan for Retest
                        </h4>
                        <div className="divide-y divide-zinc-100">
                            {retestPlansToDisplay.map((plan: any) => {
                                const cleanRemarks = (plan?.evaluationRemarks || '').replace(/\[HEAD_ACTION:[^\]]+\]/g, '').trim();
                                const mappedPlan = (savedPlans[`${selectedReq.id}-sample-${plan.sampleIndex}`] || []).find((p: any) => p.id === plan.id) || plan;

                                return (
                                    <div key={plan.id || plan.sampleIndex} className="py-4 first:pt-0 last:pb-0 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-extrabold text-[#11236a]">
                                                Sample #{plan.sampleIndex + 1} — {plan.testType?.name || 'Test Plan'}
                                            </span>
                                        </div>
                                        <div className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-rose-50 text-rose-700 rounded-full border border-rose-100">
                                                        Retest Authorized
                                                    </span>
                                                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                                                        {plan.testType?.name || 'Test Plan'}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-zinc-800 mt-1">
                                                    Product: {mappedPlan.productType || 'FATL'} | Station: S{mappedPlan.stationNo || 1} {mappedPlan.platformNos?.length > 0 ? `(Platform #${mappedPlan.platformNos.join(', #')})` : ''}
                                                </p>
                                                <p className="text-[10px] text-zinc-500 font-medium">
                                                    Duration: {mappedPlan.numberOfDays || 9} Days ({formatDateToDMY(mappedPlan.startDate)} - {formatDateToDMY(mappedPlan.endDate)})
                                                </p>
                                                {cleanRemarks && (
                                                    <p className="text-xs text-rose-700 font-semibold bg-rose-50/70 p-2.5 rounded-xl border border-rose-100 mt-2 max-w-xl">
                                                        Evaluation Remarks: <span className="font-normal">{cleanRemarks}</span>
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {(() => {
                                                    const childPlan = (selectedReq.testPlans || []).find((p: any) => Number(p.parentPlanId) === Number(plan.id)) || (plan.parentPlanId ? plan : null);
                                                    const planToEditNow = childPlan || mappedPlan;
                                                    const isChildEvaluated = childPlan && ['PASSED', 'FAILED'].includes((childPlan.evaluationStatus || '').toUpperCase());

                                                    if (isChildEvaluated) {
                                                        return (
                                                            <button
                                                                onClick={() => window.open(`/reports/preview?type=plan&key=${selectedReq.id}-plan-${childPlan.id}`, '_blank')}
                                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 border-none active:scale-95"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                                <span>View Retest Report</span>
                                                            </button>
                                                        );
                                                    }

                                                    return (
                                                        <>
                                                            <button
                                                                onClick={() => handleOpenPlanForm(plan.sampleIndex, planToEditNow)}
                                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 border-none active:scale-95"
                                                            >
                                                                <Clipboard className="w-4 h-4" />
                                                                <span>Reconfigure</span>
                                                            </button>
                                                            {Boolean(plan.parentPlanId || (selectedReq.testPlans || []).some((p: any) => Number(p.parentPlanId) === Number(plan.id))) && (
                                                                <button
                                                                    onClick={() => {
                                                                        const targetChild = (selectedReq.testPlans || []).find((p: any) => Number(p.parentPlanId) === Number(plan.id)) || plan;
                                                                        navigate(`/manager/evaluate-checksheet/${selectedReq.id}-plan-${targetChild.id}`);
                                                                    }}
                                                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 border-none active:scale-95"
                                                                >
                                                                    <span>Evaluate</span>
                                                                </button>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Modal form for editing plan */}
                    {activeSampleIndex !== null && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                            <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-5 border border-zinc-200 max-h-[90vh] overflow-y-auto no-scrollbar">
                                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                                    <div>
                                        <h4 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">
                                            Reconfigure Retest Plan (Sample #{activeSampleIndex + 1})
                                        </h4>
                                        <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                                            {selectedReq.brandName} • {selectedReq.modelNo}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveSampleIndex(null)}
                                        className="text-zinc-400 hover:text-zinc-600 p-1 border-none bg-transparent cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveTestPlan} className="space-y-5">
                                    {/* Test Type and Test Category */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor="testType" className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                                                Test Type
                                            </label>
                                            <select
                                                id="testType"
                                                value={form.testTypeId}
                                                onChange={(e) => handleTestTypeChange(e.target.value)}
                                                className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px]"
                                            >
                                                <option value="">-- Select Test Type --</option>
                                                {testTypes.map((t: any) => (
                                                    <option key={t.id} value={String(t.id)}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor="testCategory" className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                                                Test Category
                                            </label>
                                            <select
                                                id="testCategory"
                                                value={form.testCategoryId}
                                                disabled={!form.testTypeId}
                                                onChange={(e) => handleTestCategoryChange(e.target.value)}
                                                className={`bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px] ${!form.testTypeId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="">-- Select Test Category --</option>
                                                {testCategories
                                                    .filter((c: any) => String(c.testTypeId) === String(form.testTypeId))
                                                    .map((c: any) => (
                                                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                                                    ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Product Type Selection */}
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                                            Product Type
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['SATL', 'FATL', 'FAFL'].map((pType) => {
                                                const isActive = form.productType === pType;
                                                return (
                                                    <button
                                                        key={pType}
                                                        type="button"
                                                        onClick={() => handleProductTypeChange(pType)}
                                                        className={`py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer outline-none text-center ${isActive
                                                            ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700 border-blue-600'
                                                            : 'bg-white border-zinc-250 text-zinc-600 hover:bg-zinc-50'
                                                            }`}
                                                    >
                                                        {pType}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Equipment Selection */}
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="equipmentSelect" className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                                            Assign Equipment {isReliability ? '(Not permitted)' : '(Optional)'}
                                        </label>
                                        <select
                                            id="equipmentSelect"
                                            value={isReliability ? "" : form.equipmentId}
                                            disabled={isReliability}
                                            onChange={(e) => setForm({ ...form, equipmentId: e.target.value })}
                                            className={`bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px] ${isReliability ? 'opacity-50 cursor-not-allowed bg-zinc-100' : ''}`}
                                        >
                                            {isReliability ? (
                                                <option value="">-- R&D Equipment not permitted for Reliability --</option>
                                            ) : (
                                                <>
                                                    <option value="">-- Select R&D Equipment --</option>
                                                    {equipments.map((eq: any) => {
                                                        const isMaint = ['maintenance', 'under_maintenance'].includes(String(eq.status || '').toLowerCase());
                                                        const isOccupied = !eq.isAvailable || occupiedEquipmentIds.has(String(eq.id));
                                                        const isDisabled = isMaint || (isOccupied && String(form.equipmentId) !== String(eq.id));

                                                        let label = eq.name;
                                                        if (isMaint) {
                                                            label += ' (Under Maintenance - Not Available)';
                                                        } else if (isOccupied) {
                                                            label += ' (Occupied)';
                                                        } else {
                                                            label += ' (Available)';
                                                        }

                                                        return (
                                                            <option
                                                                key={eq.id}
                                                                value={String(eq.id)}
                                                                disabled={isDisabled}
                                                            >
                                                                {label}
                                                            </option>
                                                        );
                                                    })}
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    {/* Station Units & Platforms Grid Selection */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                                                Assign Platforms (Select platform from a single Station unit)
                                            </label>
                                            <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-400">
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-white border border-zinc-300 inline-block"></span>
                                                    Available
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-[#185adb] inline-block"></span>
                                                    Selected
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                                                    Occupied
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 max-h-[350px] overflow-y-auto no-scrollbar p-3 bg-[#f8fafc] rounded-2xl border border-zinc-150">
                                            {Array.from({ length: 14 }, (_, stationIdx) => {
                                                const sNum = stationIdx + 1;
                                                const isStationActive = form.stationNo === sNum;

                                                return (
                                                    <div key={sNum} className="bg-white border border-[#e4e4e7]/60 rounded-[22px] p-5 shadow-sm">
                                                        <div className="flex items-center justify-between mb-3.5">
                                                            <span className="text-xs font-bold text-slate-400 tracking-wider">Station Unit S{sNum}</span>
                                                            {isStationActive && form.platformNos.length > 0 && (
                                                                <span className="text-[8px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                                    Active (Selected: {form.platformNos.join(', ')})
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-5 gap-3">
                                                            {Array.from({ length: 10 }, (_, platformIdx) => {
                                                                const pNum = platformIdx + 1;
                                                                const isSelected = isStationActive && form.platformNos.includes(pNum);
                                                                const occupiedByLabel = occupiedPlatformMap.get(`${sNum}-${pNum}`);
                                                                const isOccupied = Boolean(occupiedByLabel);

                                                                return (
                                                                    <button
                                                                        key={pNum}
                                                                        type="button"
                                                                        disabled={isOccupied}
                                                                        onClick={() => {
                                                                            if (isOccupied) return;
                                                                            setForm(prev => {
                                                                                if (prev.stationNo !== sNum) {
                                                                                    return {
                                                                                        ...prev,
                                                                                        stationNo: sNum,
                                                                                        platformNos: [pNum]
                                                                                    };
                                                                                }
                                                                                const current = prev.platformNos;
                                                                                const updated = current.includes(pNum)
                                                                                    ? current.filter(n => n !== pNum)
                                                                                    : [...current, pNum];
                                                                                return { ...prev, platformNos: updated };
                                                                            });
                                                                        }}
                                                                        title={isOccupied ? `Occupied by: ${occupiedByLabel}` : `Station S${sNum} Platform #${pNum} (Available)`}
                                                                        className={`h-11 rounded-2xl text-xs font-bold transition-all relative flex items-center justify-center outline-none border-none ${isOccupied
                                                                            ? 'bg-[#fff1f2] text-[#f87171] cursor-not-allowed opacity-90 border border-rose-200/50'
                                                                            : isSelected
                                                                                ? 'bg-[#185adb] text-white shadow-md shadow-blue-500/20 font-bold cursor-pointer'
                                                                                : 'bg-white border border-[#e4e4e7] text-slate-800 hover:bg-slate-50 cursor-pointer'
                                                                            }`}
                                                                    >
                                                                        <span className="text-xs">{pNum}</span>
                                                                        {isOccupied && (
                                                                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#f43f5e] rounded-full border border-white shadow-xs"></span>
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Test Protocol Selection */}
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="testProtocol" className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                                            Test Protocol
                                        </label>
                                        <select
                                            id="testProtocol"
                                            value={form.testProtocolId}
                                            disabled={!form.testCategoryId}
                                            onChange={(e) => setForm({ ...form, testProtocolId: e.target.value })}
                                            className={`bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all cursor-pointer h-[42px] ${!form.testCategoryId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="">-- Select Test Protocol --</option>
                                            {testProtocols
                                                .filter((p: any) =>
                                                    String(p.testCategoryId) === String(form.testCategoryId) &&
                                                    String(p.productType).toLowerCase() === String(form.productType).toLowerCase()
                                                )
                                                .map((p: any) => (
                                                    <option key={p.id} value={String(p.id)}>{p.name}</option>
                                                ))}
                                        </select>
                                    </div>

                                    {/* Reference Standard */}
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="refStandard" className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                                            Reference Standard
                                        </label>
                                        <input
                                            id="refStandard"
                                            type="text"
                                            value={form.referenceStandard}
                                            onChange={(e) => setForm({ ...form, referenceStandard: e.target.value })}
                                            placeholder="e.g. IS 302-2-7 / IEC 60335-2-7"
                                            className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all h-[42px]"
                                        />
                                    </div>

                                    {/* Dates & Duration */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                                                Start Date
                                            </label>
                                            <input
                                                type="date"
                                                value={form.startDate}
                                                onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                                                className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all h-[42px]"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                                                Duration (Days)
                                            </label>
                                            <input
                                                type="number"
                                                value={form.numberOfDays}
                                                onChange={(e) => setForm(prev => ({ ...prev, numberOfDays: Number(e.target.value) }))}
                                                className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all h-[42px]"
                                            />
                                            {form.endDate && (
                                                <span className="text-[10px] text-zinc-500 font-bold">
                                                    End Date: {formatDateToDMY(form.endDate)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Remarks */}
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">
                                            Retest Configuration Remarks
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={form.remarks}
                                            onChange={(e) => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                                            placeholder="Optional notes or instructions for retesting..."
                                            className="bg-[#f8fafc] border border-zinc-200 rounded-xl p-3 text-zinc-800 text-xs font-semibold outline-none focus:border-[#11236a] transition-all resize-none"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                                        <button
                                            type="button"
                                            onClick={() => setActiveSampleIndex(null)}
                                            className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl cursor-pointer border-none transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 bg-[#11236a] hover:bg-[#0c1a52] text-white font-extrabold text-xs rounded-xl cursor-pointer border-none shadow-md active:scale-95 transition-all"
                                        >
                                            Submit for Retest
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}