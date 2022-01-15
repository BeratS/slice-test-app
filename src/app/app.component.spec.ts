import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { AppComponent, DIRECTION, NerbyDestPoints } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate 2 dimensional array', () => {
    const expected: [number, number][][] = [
      [[0,0], [0,1]],
      [[1,0], [1,1]]
    ];
    const app = component.generate2D(2, 2);
    expect(app.length).toEqual(2);
    expect(app).toEqual(expected);
  });

  it('should test on generate with input rows 0 and cols 0', () => {
    const app = component.generate2D(0, 0);
    expect(app.length).toEqual(0);
    expect(app).toEqual([]);
  });

  it('should test on generate with input rows -1 or cols -1', () => {
    const app = component.generate2D(-1, 0);
    expect(app.length).toEqual(0);
    expect(app).toEqual([]);
  });

  it('should generate 2 dimensional array when rows=0 and cols=1', () => {
    const app = component.generate2D(0, 1);
    expect(app.length).toEqual(0);
    expect(app).toEqual([]);
  });

  it('should generate 2 dimensional array when rows=1 and cols=0', () => {
    const app = component.generate2D(1, 0);
    expect(app.length).toEqual(0);
    expect(app).toEqual([]);
  });

  it('should test on add a new point', () => {
    spyOn<any>(component['logSubc'], 'next').withArgs(DIRECTION.TOP);
    component.addPointToResult(DIRECTION.TOP, [1, 3]);
    expect(component['logSubc'].next).toHaveBeenCalledWith(DIRECTION.TOP);
  });

  // ------------------------------------------------------------

  it('should test on execute input value 2x2', () => {
    component.inputControl.patchValue('2x2');
    const spyOnSimulate = spyOn(component, 'onSimulate');
    const spyOnPoints = spyOn(component, 'onSetPoints');
    const spyOnGen = spyOn(component, 'generate2D');
    component.onExecuteInputValue();
    expect(spyOnGen).toHaveBeenCalledWith(2, 2);
    expect(spyOnPoints).not.toHaveBeenCalled();
    expect(spyOnSimulate).not.toHaveBeenCalled();
  });

  it('should test on execute input value 2x2 and call setPoints', () => {
    component.inputControl.patchValue('2x2 (1, 2)');
    const spyOnSimulate = spyOn(component, 'onSimulate');
    const spyOnPoints = spyOn(component, 'onSetPoints');
    const spyOnGen = spyOn(component, 'generate2D');
    component.onExecuteInputValue();
    expect(spyOnGen).toHaveBeenCalledWith(2, 2);
    expect(spyOnPoints).toHaveBeenCalledWith('(1, 2)');
    expect(spyOnSimulate).toHaveBeenCalled();
  });

  it('should test on execute input value when is invalid', () => {
    component.inputControl.patchValue('2x');
    const spyOnGen = spyOn(component, 'generate2D');
    const app = component.onExecuteInputValue();
    expect(app).toBeUndefined();
    expect(spyOnGen).not.toHaveBeenCalled();
  });

  // ------------------------------------------------------------

  it('should test onSetPoints', () => {
    component.onSetPoints('(1, 2)')
    expect(component.points).toEqual([[1, 2]]);
  });

  it('should test log asynchronous', fakeAsync(() => {
    const currStep = [1, 0];
    component.addPointToResult(DIRECTION.TOP, currStep);
        
    component.log$.pipe(take(1)).subscribe(
      v => {
        expect(v).toEqual(DIRECTION.TOP)
        expect(component.result).toEqual([DIRECTION.TOP])
      }
    );    
    component.step$.pipe(take(1)).subscribe(
      v => {
        expect(v).toEqual(currStep)
        expect(component.currStep).toEqual(currStep)
      }
    );

    tick(1000);
  }));

  it('should test the setpoint when start is invalid', () => {
    component.onSetPoints('(,0)');
    expect(component.points).toEqual([[0, 0]]);
  });

  it('should test the setpoint when end is invalid', () => {
    component.onSetPoints('(0,)');
    expect(component.points).toEqual([[0, 0]]);
  });
  
  // ------------------------------------------------------------
  // -------- Should test the point does exist ------------------
  // ------------------------------------------------------------
  
  it('should test doesPointIncludes when exists', () => {
    component.points = [[1, 2]];
    expect(component.doesPointIncludes([1, 2])).toBeTruthy();
  });
  
  it('should test doesPointIncludes when not exists', () => {
    component.points = [];
    expect(component.doesPointIncludes([1, 2])).toBeFalsy();
  });
  
  // ------------------------------------------------------------
  // -------- Should test on out of grid range points -----------
  // ------------------------------------------------------------
  
  it('should test on call checkPointIsInGrid when is out of range', () => {
    component.grid = component.generate2D(2, 2);
    expect(component.checkPointIsInGrid([3, 3])).toBeFalsy();
  });

  it('should test on call checkPointIsInGrid when is in grid', () => {
    component.grid = component.generate2D(2, 2);
    expect(component.checkPointIsInGrid([1, 1])).toBeTruthy();
  });
  
  // ------------------------------------------------------------
  // -------- Should test on simulate points --------------------
  // ------------------------------------------------------------
  
  it('should test onSimulate method with correct values', () => {
    spyOn(component, 'onFindNearbyDestPoints')
      .withArgs(component.points)
      .and.returnValue([{
        step: 1,
        value: [1, 1]
      }] as NerbyDestPoints[]);
    component.onSimulate();
    expect(component.onFindNearbyDestPoints).toHaveBeenCalledWith(component.points);
  });

  it('should test onSimulate method with empty values', () => {
    spyOn(component, 'onFindNearbyDestPoints')
      .withArgs(component.points)
      .and.returnValue([] as NerbyDestPoints[]);
    component.onSimulate();
    expect(component.onFindNearbyDestPoints).toHaveBeenCalledWith(component.points);
  });

  it('should test onSimulate method on out of range', () => {
    spyOn(component, 'onFindNearbyDestPoints')
      .withArgs(component.points)
      .and.returnValue([{
        step: 1,
        value: [3, 3]
      }] as NerbyDestPoints[]);
    const addDirSpy = spyOn(component, 'onAddPointDirection');
    component.grid = component.generate2D(2, 2);
    component.onSimulate();
    expect(component.onFindNearbyDestPoints).toHaveBeenCalledWith(component.points);
    expect(addDirSpy).not.toHaveBeenCalled();
  });
  
  // ------------------------------------------------------------
  // -------- Should test on on find nearby points --------------
  // ------------------------------------------------------------

  it('should test onFindNearbyDestPoints with correct points', () => {
    const app = component.onFindNearbyDestPoints([[1, 3], [2, 0], [3, 2]]);
    expect(app).toEqual([
      {step: 2, value: [2, 0]},
      {step: 3, value: [3, 2]},
      {step: 3, value: [1, 3]},
    ] as NerbyDestPoints[]);
  });
  
  it('should test onFindNearbyDestPoints with correct points ordering', () => {
    const app = component.onFindNearbyDestPoints([[3, 3], [4, 4], [1, 1]]);
    expect(app).toEqual([
      {step: 2, value: [1, 1]},
      {step: 4, value: [3, 3]},
      {step: 2, value: [4, 4]},
    ] as NerbyDestPoints[]);
  });
  
  it('should test onFindNearbyDestPoints with single one', () => {
    const app = component.onFindNearbyDestPoints([[0, 1]]);
    expect(app).toEqual([
      {step: 1, value: [0, 1]},
    ] as NerbyDestPoints[]);
  });
  
  it('should test onFindNearbyDestPoints with wrong value [0, 0]', () => {
    const app = component.onFindNearbyDestPoints([[0, 0]]);
    expect(app).toEqual([
      {step: 0, value: [0, 0]},
    ] as NerbyDestPoints[]);
  });

  // ------------------------------------------------------------
  // -------- Should test on add point to direction -------------
  // ------------------------------------------------------------

  it('should test onAddPointDirection with top and right direction', () => {
    const addPointSpy = spyOn(component, 'addPointToResult');

    component.onAddPointDirection([0, 0], [1, 2], 3);

    expect(addPointSpy).toHaveBeenCalledTimes(4);
  });

  it('should test onAddPointDirection with bottom and left direction', () => {
    const addPointSpy = spyOn(component, 'addPointToResult');

    component.onAddPointDirection([2, 2], [1, 1], 3);

    expect(addPointSpy).toHaveBeenCalledTimes(4);
  });

  // ------------------------------------------------------------
  // -------- Should check the person point movement ------------
  // ------------------------------------------------------------
  
  it('should test checkPersonPoint', () => {
    component.currStep = [2, 2];
    const app = component.checkPersonPoint([2, 2]);
    expect(app).toBeTruthy();
  });

  it('should test checkPersonPoint on wrong', () => {
    component.currStep = [1, 2];
    const app = component.checkPersonPoint([2, 2]);
    expect(app).toBeFalsy();
  });

});
