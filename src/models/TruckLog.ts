export default interface TruckLog {
    deviceId: string;
    timestamp: string;
    location: {
      latitude: number;
      longitude: number;
      altitude: number;
      precision?: number;  //optional precision metadata for location accuracy
    };
    mass:TruckMass,
    metadata?: {  // Optional, in case additional metadata is not needed
      fleet?: string;
      company?:string;
      logProcessedAt?: string;
    };
  }


  type MassUnit = 'kg' | 't' | 'lb';

  interface TruckMass {
    value: number;
    unit: MassUnit;
  }
