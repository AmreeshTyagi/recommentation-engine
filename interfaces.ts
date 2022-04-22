export interface ILocation {
  lat: number;
  lng: number;
}

export interface IVisitor {
  lat: number;
  lng: number;
  current_time: number;
}

export interface IRestaurant {
  restaurant_name: string;
  timeslot: string;
  rating: number;
  lat: number;
  lng: number;
}
export interface IVisitorNearestPoint {
  restaurant?: IRestaurant;
  lat: number;
  lng: number;
  type: "RESTAURANT" | "VISITOR";
  distance?: number;
}
