import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { BehaviorSubject, concatMap, findIndex, of, Subject } from 'rxjs';

const InputRegex = /^(([1-9]{1,3}x[1-9]{1,3})?)+((\s\(\d,\s?\d\))+)?$/;

export enum DIRECTION {
  TOP = 'N',
  RIGHT = 'E',
  BOTTOM = 'S',
  LEFT = 'W',
  DROP_PIZZA = 'D'
}

export interface NerbyDestPoints {
  step: number;
  value: number[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Slice test';

  grid: [number, number][][] = [];
  points: [number, number][] = [];

  // See the result steps
  result: string[] = [];
  private logSubc = new Subject<string>();
  log$ = this.logSubc.asObservable().pipe(
    concatMap((v: string) => {
      // Fill array with direction
      this.result.push(v);
      // Animate step by step
      return new Promise(resolve =>
        setTimeout(() => resolve(this.result.join('')), 1000))
    })
  );

  currStep = [0, 0];
  private stepSubc = new BehaviorSubject<number[]>(this.currStep);
  step$ = this.stepSubc.asObservable().pipe(
    concatMap((v: number[]) => {
      // Animate step by step
      return new Promise<number[]>(resolve =>
        setTimeout(() => resolve(v), 1000))
    }),
    concatMap((value: number[]) => {
      this.currStep = value;
      return of(value);
    })
  );

  inputControl = new FormControl('', [Validators.pattern(InputRegex)]);

  constructor() {
    this.inputControl.patchValue('5x5 (1, 3) (2, 0) (3, 2)');
  }

  clearPointResult(): void {
    this.result = [];
  }

  addPointToResult(value: string, point: number[]): void {
    this.logSubc.next(value);
    this.stepSubc.next(point);
  }

  // Create 2 dimensional array, dynamically as you set
  generate2D(rows: number, cols: number): [number, number][][] {
    // Check if rows or cols are negative
    if (rows < 0 || cols < 1) { return []; }
    // ES6 Generate array of strings as you set the limit
    return Array(rows).fill(0).map((_, x) =>
           Array(cols).fill(0).map((__, y) => [Number(x), Number(y)]));
  }

  // On execute method when you change the input value
  onExecuteInputValue(): void {
    if (
      this.inputControl.value.length === 0 ||
      this.inputControl.invalid) { return; }

    const value = this.inputControl.value;

    // Split value
    const splitVal = value.split(' ');
    // Check if the split val is empty
    if (splitVal.length < 1) { return; }

    let splitX = splitVal[0].split('x');

    // Check if the split val is empty
    if (splitX.length < 1) { return; }

    // on generate the 2D grid
    this.grid = this.generate2D(Number(splitX[0]), Number(splitX[1]));
    
    // Check is there has points
    if (!splitVal[1] || splitVal[1].length < 1) { return; }

    const points = [...splitVal]
    points.shift();

    // On store points selected
    this.onSetPoints(points.join(' '));

    // Clear Result Points
    this.clearPointResult();

    // On Simulate
    this.onSimulate();
  }

  // As for the given example of input need to convert to array of strings the points
  onSetPoints(points: string): void {
    this.points = points.replace(/\s/g, '').replace(/\)/g, '').split('(').filter(Boolean).map(
      val => {
        const [s, e] = val.split(',');
        
        const first = s ? Number(s) : 0; 
        const second = e ? Number(e) : 0;

        return [first, second];
      }
    );
  }

  // It will sort the points by nearest destination
  onFindNearbyDestPoints(points: [number, number][]): NerbyDestPoints[] {
    let result: NerbyDestPoints[] = [];

    // Go to each point
    let lastDestLn = 0;
    let currPoint = [0, 0];

    // Iterate to each point
    for(let i = 0; i < points.length; i++) {

      // Reset the last destionation point
      lastDestLn = 0;

      // Set chossen point
      let value: number[] = [];

      for(let j = 0; j < points.length; j++) {

        let p = points[j];
        
        const first = p[0] ?? 0; 
        const second = p[1] ?? 0;

        // Skip if already is on the list added
        if (
          result.length > 0 &&
          result.some((r: NerbyDestPoints) => this.checkPoint(r.value, p))
        ) { continue; }

        // compare the starting point to next point
        // as well from that stored point to next
        const x = (first > currPoint[0])
          ? first - currPoint[0]
          : currPoint[0] - first;

        const y = (second > currPoint[1])
          ? second - currPoint[1]
          : currPoint[1] - second;

        const xy = x + y;

        if (lastDestLn === 0 || xy < lastDestLn) {
          lastDestLn = x + y;

          // Set value
          value = [first, second];
        }
      }
      
      // Push points
      result.push({
        step: lastDestLn, value
      })
          
      // Store the last points
      currPoint = value;
    }

    return result;
  }

  checkPoint(e: number[], p: number[]): boolean {
    return e[0] === p[0] && e[1] === p[1];
  }

  // Check point is out of grid range
  checkPointIsInGrid(p: number[]): boolean {
    let isInGrid = true;
    for (const g of this.grid) {
      const check = g.some(e => this.checkPoint(e, p));
      if (check) {
        isInGrid = true;
        break;
      }
      isInGrid = false;
    }
    return isInGrid;
  }

  // Simulate the road to points
  onSimulate(): void {
    // get fastest route destination by sorting and simplifying them.
    const sortPoints = this.onFindNearbyDestPoints(this.points);

    let startingPoint = [0, 0];
    // On simulate each points
    sortPoints.forEach(obj => {
      const p = obj.value;

      // check point is out of grid range
      const isInGrid = this.checkPointIsInGrid(p);

      if (!isInGrid) {
        alert(`Out of grid range ${p.toString()}`);
        return;
      }

      this.onAddPointDirection(startingPoint, p, obj.step);
      startingPoint = p;
    });
  }

  // Going to each point and submit the result
  onAddPointDirection(currPoint: number[], point: number[], ln: number): void {
    let [currFirst, currSecond] = [...currPoint];
    let [first, second] = point;

    for (let i = 0; i < ln; i++) {
      if (second !== currSecond) {        
        if (second > currSecond) {
          this.addPointToResult(DIRECTION.RIGHT, [currFirst, currSecond]);
          currSecond += 1;
        } else {
          this.addPointToResult(DIRECTION.LEFT, [currFirst, currSecond]);
          currSecond -= 1;
        }
      } else if (first !== currFirst) {
        if (first > currFirst) {
          this.addPointToResult(DIRECTION.TOP, [currFirst, currSecond]);
          currFirst += 1;
        } else {
          this.addPointToResult(DIRECTION.BOTTOM, [currFirst, currSecond]);
          currFirst -= 1;
        }
      }
      if (first === currFirst && second === currSecond) {
        this.addPointToResult(DIRECTION.DROP_PIZZA, [currFirst, currSecond]);
      }
    }
  }

  // Check the point includes inside the store points
  doesPointIncludes(r: [number, number]): boolean {
    return this.points.some(p => this.checkPoint(r, p));
  }

  // Check the point includes inside the store points
  checkPersonPoint(r: [number, number]): boolean {
    return this.checkPoint(r, this.currStep);
  }

}
