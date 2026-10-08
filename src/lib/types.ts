export type Workspace = "all" | "poultry" | "reptile";
export type AnimalKind = Exclude<Workspace, "all">;
export type AnimalStatus = "Healthy" | "Monitoring" | "Quarantine" | "Deceased";
export type LogKind =
  | "Eggs"
  | "Feeding"
  | "Weight"
  | "Shedding"
  | "Environment"
  | "Health"
  | "Cleaning";
export interface Animal {
  id: string;
  name: string;
  kind: AnimalKind;
  species: string;
  breed: string;
  sex: "Female" | "Male" | "Unknown";
  born: string;
  habitatId: string;
  status: AnimalStatus;
  image: string;
  notes: string;
  acquired: string;
  motherId: string;
  fatherId: string;
  deceased?: string;
}
export interface Habitat {
  id: string;
  name: string;
  kind: AnimalKind;
  type: string;
  description: string;
  warmMin: number;
  warmMax: number;
  coolMin: number;
  coolMax: number;
  humidityMin: number;
  humidityMax: number;
  uvbReplaced: string;
  uvbMonths: number;
}
export interface CareTask {
  id: string;
  title: string;
  kind: Workspace;
  due: string;
  time: string;
  repeatDays: number;
  animalId: string;
  habitatId: string;
  completed: boolean;
  notes: string;
}
export interface RecordLog {
  id: string;
  kind: LogKind;
  workspace: AnimalKind;
  date: string;
  time: string;
  animalId: string;
  habitatId: string;
  value: number;
  unit: string;
  notes: string;
  temperature?: number;
  coolTemperature?: number;
  humidity?: number;
  cost?: number;
}
export interface Feed {
  id: string;
  name: string;
  kind: AnimalKind;
  stock: number;
  unit: string;
  dailyUse: number;
  cost: number;
  purchased: string;
}
export interface Treatment {
  id: string;
  animalId: string;
  medicine: string;
  started: string;
  ended: string;
  withdrawalEnd: string;
  dose: string;
  vet: string;
  notes: string;
}
export interface Clutch {
  id: string;
  name: string;
  kind: AnimalKind;
  started: string;
  expected: string;
  eggs: number;
  fertile: number;
  hatched: number;
  motherId: string;
  fatherId: string;
  temperature: number;
  notes: string;
}
export interface Settings {
  keeper: string;
  collection: string;
  country: "England" | "Wales" | "Scotland" | "Northern Ireland";
  postcode: string;
  aphaReference: string;
  aphaUpdated: string;
}
export interface AppData {
  version: 1;
  demo: boolean;
  animals: Animal[];
  habitats: Habitat[];
  tasks: CareTask[];
  logs: RecordLog[];
  feed: Feed[];
  treatments: Treatment[];
  clutches: Clutch[];
  checklist: string[];
  settings: Settings;
}
export type PageId =
  | "overview"
  | "animals"
  | "habitats"
  | "records"
  | "planner"
  | "health"
  | "feed"
  | "breeding"
  | "insights"
  | "guide"
  | "directory"
  | "settings";
