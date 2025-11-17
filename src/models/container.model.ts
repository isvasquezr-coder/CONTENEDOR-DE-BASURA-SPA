export type ContainerStatus = 'OK' | 'Full' | 'Overweight' | 'Pickup Required';

export interface Location {
  address: string;
  gridX: number; // For simulated map position (1-based)
  gridY: number; // For simulated map position (1-based)
}

export interface SmartContainer {
  id: string;
  location: Location;
  fillLevel: number; // percentage, 0-100
  weight: number; // in kg
  status: ContainerStatus;
  fillRate?: number; // Arbitrary units, e.g., % per update
}
