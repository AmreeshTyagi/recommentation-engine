import { degrees_to_radians, radians_to_degrees } from "./helper";
import inside from "point-in-polygon-hao";
import restaurants from "./data/restaurants.json";
import visitors from "./data/visitors.json";
import { ILocation, IVisitor, IVisitorNearestPoint } from "./interfaces";
import chalk from "chalk";
let visitorRestaurantPolygons = [] as any;

const NEAREST_DISTANCE = 1; // in miles
const TIMINGS = [
  {
    start: 800,
    end: 1100,
    slot: "breakfast",
  },
  {
    start: 1200,
    end: 1500,
    slot: "lunch",
  },
  {
    start: 1830,
    end: 2130,
    slot: "dinner",
  },
];

function start() {
  console.log("Starting application..");

  visitors.forEach((visitor) => {
    //Check if any distance is already calculated & has polygon
    if (visitorRestaurantPolygons.length == 0) {
      recommendWithNewPolygon(visitor);
    } else {
      recommendWithCachedPolygon(visitor);
    }
  });
}

function recommendWithCachedPolygon(visitor: IVisitor) {
  let isExist = null;
  visitorRestaurantPolygons.forEach((item: any, index: any) => {
    const polygons = [item.polygon];
    isExist = inside([visitor.lat, visitor.lng], polygons);
    if (isExist === 0 || isExist === true) {
      recommend(item.pointList, visitor);
    }
  });

  if (isExist == null || isExist === false) {
    recommendWithNewPolygon(visitor);
  }
}
function recommendWithNewPolygon(visitor: IVisitor) {
  const pointList = filterByNearestPoint(visitor);
  recommend(pointList, visitor);
}

function recommend(pointList: IVisitorNearestPoint[], visitor: IVisitor) {
  const restaurantList = filterWithTimeSlot(pointList, visitor);
  const finalList = sortByRating(restaurantList).slice(0, 2); // Select top 3

  if (finalList.length) {
    console.log("                         ");
    console.log("----------------------");
    console.log(`Top nearby restaurants are:`);
    console.log("----------------------");

    finalList.forEach((item) => {
      console.log(chalk.blue("NAME"), item.restaurant?.restaurant_name);
      console.log(chalk.yellow("RATING"), item.restaurant?.rating);
      console.log(chalk.green("TIMESLOT"), item.restaurant?.timeslot);
      console.log(chalk.green("DISTANCE"), item.distance);
      console.log("----------");
    });
  }
}

function filterByNearestPoint(visitor: IVisitor) {
  const visitorLocation: ILocation = {
    lat: visitor.lat,
    lng: visitor.lng,
  };
  let newpolygon = [];
  let pointList = [] as IVisitorNearestPoint[];

  //Create a ploygon with minimumn 3 points
  pointList.push({
    lat: visitor.lat,
    lng: visitor.lng,
    type: "VISITOR",
  });
  newpolygon.push([visitor.lat, visitor.lng]);

  restaurants.forEach((restaurant) => {
    const restaurantLocation: ILocation = {
      lat: restaurant.lat,
      lng: restaurant.lng,
    };
    const distance = calculateDistance(visitorLocation, restaurantLocation);

    // Business criteria
    if (distance <= NEAREST_DISTANCE) {
      pointList.push({
        restaurant: restaurant,
        distance: distance,
        type: "RESTAURANT",
        lat: restaurantLocation.lat,
        lng: restaurantLocation.lng,
      });
      newpolygon.push([restaurantLocation.lat, restaurantLocation.lng]);
    }
    // console.log(
    //   `distance of visitor from restaurant ${restaurant.restaurant_name} is ${distance}`
    // );
  });
  //Completing polygon by pushing same point as last element of array.
  newpolygon.push([visitor.lat, visitor.lng]);
  pointList.push({
    lat: visitor.lat,
    lng: visitor.lng,
    type: "VISITOR",
  });

  if (newpolygon.length >= 4) {
    // Push more than 3 points polygon to local cache object
    console.log("Valid polygon");
    visitorRestaurantPolygons.push({
      polygon: newpolygon,
      pointList: pointList,
    });
  }

  return pointList;
}

function filterWithTimeSlot(
  _pointList: IVisitorNearestPoint[],
  _visitor: IVisitor
) {
  const timeSlot = TIMINGS.find(
    (time) =>
      _visitor.current_time >= time.start && _visitor.current_time <= time.end
  );
  const restaurantList = _pointList.filter(
    (point) =>
      point.type == "RESTAURANT" && point.restaurant?.timeslot == timeSlot?.slot
  );
  return restaurantList;
}

function sortByRating(_restaurantList: IVisitorNearestPoint[]) {
  const sortedByRatingList = _restaurantList.sort(function (a, b) {
    if (a.restaurant && b.restaurant) {
      return a.restaurant?.rating - b?.restaurant?.rating;
    } else {
      return 0;
    }
  });
  return sortedByRatingList.reverse();
}

function calculateDistance(location1: ILocation, location2: ILocation) {
  // console.log(location1.lat, location1.lng, location2.lat, location2.lng);
  //rad2deg(acos(sin(deg2rad(lat1)) * sin(deg2rad(lat2)) +  cos(deg2rad(lat1)) * cos(deg2rad(lat2)) * cos(deg2rad(lon1 - lon2)))) * 60 * 1.1515
  return (
    radians_to_degrees(
      Math.acos(
        Math.sin(degrees_to_radians(location1.lat)) *
          Math.sin(degrees_to_radians(location2.lat)) +
          Math.cos(degrees_to_radians(location1.lat)) *
            Math.cos(degrees_to_radians(location2.lat)) *
            Math.cos(degrees_to_radians(location1.lng - location2.lng))
      )
    ) *
    60 *
    1.1515
  );
}

start();
