type argumentsLessAction = () => void | Promise<void>
type argumentsAction = (...args: any[]) => void | Promise<void>
export type event<e> = (...args:e[]) => boolean | Promise<boolean>
export type action = argumentsLessAction | argumentsAction | null

/* StateError is a class that extends Error and has a constructor that takes a string and passes it to
the super constructor. */
export class StateError extends Error {
    /**
     * The constructor function is a special function that is called when a new instance of the class is
     * created
     * @param {string} message - string - The message that will be displayed when the error is thrown.
     */
    constructor(message: string) {
        super(message)
    }
}


/* It's a state that can be entered and left, and it can be final */
export class State<t> {
    label: t
    isFinal: boolean
    enteringHook: action | null
    leavingHook: action | null

    /**
     * It creates a new state with the given label, and optionally, entering and leaving hooks, and whether
     * or not it's a final state
     * @param {t} label - the label of the state
     * @param {action} [enteringHook=null] - action = null
     * @param {action} [leavingHook=null] - action = null
     * @param [isFinal=false] - If true, the state is a final state.
     */
    constructor(label: t, enteringHook: action = null, leavingHook: action = null, isFinal = false) {
        this.label = label
        this.isFinal = isFinal
        this.enteringHook = enteringHook
        this.leavingHook = leavingHook
    }
}

/* A transition is a link between two states, and it is triggered by an event */
export class Transition<t,e> {
    private from: State<t>
    private to: State<t>
    private evt: event<e>
    private act: action | null

    /**
     * > The constructor for the Transition class takes a from state, a to state, an event, and an action
     * @param from - The state that the transition is coming from.
     * @param to - The state that the transition will go to.
     * @param evt - The event that triggers the transition.
     * @param {action} [act=null] - action = null
     */
    constructor(from: State<t>, to: State<t>, evt: event<e>, act: action = null) {
        this.from = from
        this.to = to
        this.evt = evt
        this.act = act
    }

    /* It's a function that checks if the transition is triggered by the event passed as a parameter. */
    check = async (state: State<t>, eventArgs:e[]): Promise<boolean> => {
        return JSON.stringify(state) === JSON.stringify(this.from) && (await (this.evt(...eventArgs)))
    }

    /**
     * It returns the value of the act property.
     * @returns The value of the act property.
     */
    get action() { return  this.act }

    /**
     * It returns the value of the to property.
     * @returns The next state
     */
    get nextState() { return this.to }
}

/* It's a class that represents a finite state machine */
export class Automata<t,e> {
    private states: State<t>[]
    transitions: Transition<t,e>[]
    private initial: State<t>
    private currentState: State<t>

    /**
     * It takes an initial state, a list of states, and a list of transitions, and returns a new FSM
     * @param initialState - The initial state of the machine.
     * @param {State<t>[]} states - An array of all the states in the state machine.
     * @param {Transition<t,e>[]} transitions - An array of Transition objects.
     */
    constructor(initialState: State<t>, states: State<t>[], transitions: Transition<t,e>[]) {
        this.states = states
        this.transitions = transitions
        this.initial = initialState
        this.currentState = this.initial
    }

    /**
     * The function returns the current state of the state machine.
     * @returns The current state of the game.
     */
    get CurrentState() { return this.currentState }

    /* It's a function that checks if the state passed as a parameter is in the states list. */
    private hasState = (s:State<t>): boolean => {
        for(let state of this.states)
            if(s === state)
                return true
        return false
    }

    /* It's a function that changes the current state of the state machine. */
    private changeState = (newState:State<t>) => {
        this.currentState = newState
        if(newState.enteringHook)
            newState.enteringHook()
    }

    /* It's a function that checks if the current state is final. */
    public done = (): boolean => this.currentState.isFinal;

    /* It's a function that takes an event and an action, and it checks if the current state has a
    transition
    triggered by the event, and if it does, it executes the action and changes the state to the next
    state. */
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

    /* It's a function that returns a promise that resolves after a given amount of time. */
    private delay = async (ms: number): Promise<void> => {
        return new Promise(r => setTimeout(r,ms))
    }

    public stepAfterTimeout = async (ms: number, evtArgs: e[], actionArgs: any[] | null = null): Promise<boolean> => {
        await this.delay(ms)
        return (await this.step(evtArgs, actionArgs))
    }
}