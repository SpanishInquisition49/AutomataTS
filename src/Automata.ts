type argumentsLessAction = () => void | Promise<void>
type argumentsAction = (...args: any[]) => void | Promise<void>
export type event<e> = (...args:e[]) => boolean | Promise<boolean>
export type action = argumentsLessAction | argumentsAction | null

export class StateError extends Error {
    constructor(message: string) {
        super(message)
    }
}


export class State<t> {
    label: t
    isFinal: boolean
    enteringHook?: action
    leavingHook?: action

    constructor(label: t, enteringHook: action = null, leavingHook: action = null, isFinal = false) {
        this.label = label
        this.isFinal = isFinal
        this.enteringHook = enteringHook
        this.leavingHook = leavingHook
    }
}

export class Transition<t,e> {
    private from: State<t>
    private to: State<t>
    private evt: event<e>
    private act: action | null

    constructor(from: State<t>, to: State<t>, evt: event<e>, act: action = null) {
        this.from = from
        this.to = to
        this.evt = evt
        this.act = act
    }

    check = async (state: State<t>, eventArgs:e[]): Promise<boolean> => {
        return JSON.stringify(state) === JSON.stringify(this.from) && (await (this.evt(...eventArgs)))
    }

    get action() { return  this.act }

    get nextState() { return this.to }
}

export class Automata<t,e> {
    private states: State<t>[]
    transitions: Transition<t,e>[]
    private initial: State<t>
    private currentState: State<t>

    constructor(initialState: State<t>, states: State<t>[], transitions: Transition<t,e>[]) {
        this.states = states
        this.transitions = transitions
        this.initial = initialState
        this.currentState = this.initial
    }

    get CurrentState() { return this.currentState }

    private hasState = (s:State<t>): boolean => {
        for(let state of this.states)
            if(s === state)
                return true
        return false
    }

    private changeState = (newState:State<t>) => {
        this.currentState = newState
        if(newState.enteringHook)
            newState.enteringHook()
    }

    public done = (): boolean => this.currentState.isFinal;

    public step = async (evtArgs: e[], actionArgs: any[] | null = null): Promise<boolean> => {
        for(let transition of this.transitions) {
            if(!(await transition.check(this.currentState, evtArgs)))
                continue
            if(!this.hasState(transition.nextState)){
                throw new StateError(`State ${transition.nextState.label} is not in the States list`)
            }
            if(this.currentState.leavingHook)
                this.currentState.leavingHook()
            if(transition.action !== null){
                if(actionArgs)
                    await transition.action(...actionArgs);
                else
                    await transition.action()
                }
            this.changeState(transition.nextState)
            return true
        }
        return false
    }
}