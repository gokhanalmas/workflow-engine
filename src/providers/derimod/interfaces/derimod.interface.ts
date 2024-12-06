export interface IDerimodWorker {
  firstName: string;
  lastName: string;
  userId: string;
  company: string;
  workplace: string;
  department: string;
  position: string;
  birthday: string;
  mobilePhone: string | null;
  email: string;
  employementStart: string;
  employementFinish: string | null;
  status: string;
  managerUserId: string;
}

export interface IDerimodAuthResponse {
  token: string;
}