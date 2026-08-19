export type FlightPoint = { x: number; y: number };

export type WordFlightPath = {
  start: FlightPoint;
  end: FlightPoint;
};

export function getElementCenter(element: HTMLElement): FlightPoint {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}
