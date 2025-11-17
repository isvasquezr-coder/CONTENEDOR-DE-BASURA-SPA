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
  status: 'Idle' | 'On Route';
  targetContainerIds?: string[];
}
