import client from './client';

const unwrap = (response) => response.data?.results ?? response.data ?? [];

export const getHrSummary = () => client.get('/hr/summary/').then((r) => r.data);

export const getHrWorkerOptions = () => client.get('/hr/worker-options/').then((r) => r.data);

export const listLaborWorkers = () => client.get('/hr/labor/').then(unwrap);
export const createLaborWorker = (data) => client.post('/hr/labor/', data).then((r) => r.data);
export const updateLaborWorker = (id, data) => client.patch(`/hr/labor/${id}/`, data).then((r) => r.data);
export const deleteLaborWorker = (id) => client.delete(`/hr/labor/${id}/`);

export const listSalaryAdvances = () => client.get('/hr/advances/').then(unwrap);
export const createSalaryAdvance = (data) => client.post('/hr/advances/', data).then((r) => r.data);
export const updateSalaryAdvance = (id, data) => client.patch(`/hr/advances/${id}/`, data).then((r) => r.data);
export const deleteSalaryAdvance = (id) => client.delete(`/hr/advances/${id}/`);

export const listDailyWages = (params) => client.get('/hr/daily-wages/', { params }).then(unwrap);
export const createDailyWage = (data) => client.post('/hr/daily-wages/', data).then((r) => r.data);
export const updateDailyWage = (id, data) => client.patch(`/hr/daily-wages/${id}/`, data).then((r) => r.data);
export const deleteDailyWage = (id) => client.delete(`/hr/daily-wages/${id}/`);
