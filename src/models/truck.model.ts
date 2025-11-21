export interface Truck {
  id: string;
  location: {
    gridX: number;
    gridY: number;
  };
  path: {
    gridX: number;
    gridY: number;
  }[];
  status: 'Idle' | 'On Route' | 'Cleaning' | 'Returning to Depot';
  targetContainerIds?: string[];
  capacity: number;
  currentLoad: number;
  isCleaning: boolean;
  maintenanceRequired: boolean;
}
