import { Automata, State, StateError, Transition } from "../src/Automata";
//@ts-ignore
import {toHaveBeenCalledBefore, toHaveBeenCalledAfter} from '../node_modules/jest-extended'
expect.extend({toHaveBeenCalledBefore, toHaveBeenCalledAfter});

const enteringMock = jest.fn()
const leavingMock = jest.fn()
const fromState = new State(0, enteringMock, leavingMock )
const toState = new State(1, enteringMock)
const evt = jest.fn().mockReturnValue(true)
const act = jest.fn()
const transition = new Transition(fromState, toState, evt, act)

describe('State', () => {
    test('Should be equal to fromState', () => {
        const state = new State(0, enteringMock, leavingMock)
        expect(state).toEqual(fromState)
    })
    
    test('Should Create a State labeled with 0 and not final', () => {
        const state2 = new State(0)
        expect(state2).toEqual({label:0, isFinal: false, enteringHook: null, leavingHook: null} as State<number>)
    })
})

describe('Transition', () => {
    test('Should be defined', () => {
        expect(transition).toBeDefined()
    })

    test('Next State should be "toState"', () => {
        expect(transition.nextState).toBe(toState)
    })

    test('Action should be equal to "act"', () =>{
        expect(transition.action).toEqual(act)
    })

    test('Transition check should return true', async () => {
        await expect(transition.check(fromState, [])).resolves.toBe(true)
    })
    test('Transition check should return false', async () => {
        await expect(transition.check(toState, [])).resolves.toBe(false)
    })
})

describe('Automata', () => {
    const middleState: State<number> = new State(2)
    const finalState: State<number> = new State(3, null, null, true)
    const middleTransition = new Transition(toState, middleState, evt, act)
    const finalTransition = new Transition(middleState, finalState, evt)
    const wrongTransition = new Transition(toState, new State(5), () => true, null)
    const automata = new Automata(fromState, [fromState, toState, middleState, finalState], [transition, middleTransition, finalTransition])
    const automata2 = new Automata(toState, [fromState, toState], [transition, wrongTransition])
    
    test('Should be defined', () => {
        expect(automata).toBeDefined()
    })

    test('Should be in State: "fromState"', () =>{
        expect(automata.CurrentState).toBe(fromState)
    })

    test('Should not be done', () => {
        expect(automata.done()).toBe(false)
    })

    test('Should do a transition calling "act" without arguments', async () => {
        await expect(automata.step([])).resolves.toBe(true)
        expect(evt).toBeCalled()
        expect(act).toBeCalledWith()
        expect(leavingMock).toHaveBeenCalledBefore(act)
        expect(enteringMock).toHaveBeenCalledAfter(act)        
        expect(automata.CurrentState).toBe(toState)
    })

    test('Should do a transition calling "act" with arguments', async () => {
        const args = ['test', 5, true]
        expect(automata.CurrentState).toBe(toState)
        await expect(automata.step([], args)).resolves.toBe(true)
        expect(evt).toBeCalled()
        expect(act).toBeCalledWith(...args)
        expect(enteringMock).not.toHaveBeenCalled()
        expect(leavingMock).not.toHaveBeenCalled()
        expect(automata.CurrentState).toBe(middleState)
    })
    
    test('Should do a transition without calling "act"', async () => {
        expect(automata.CurrentState).toBe(middleState)
        await expect(automata.step([])).resolves.toBe(true)
        expect(evt).toBeCalled()
        expect(act).not.toHaveBeenCalled()
        expect(automata.CurrentState).toBe(finalState)
    })

    test('Should have been done', () => {
        expect(automata.done()).toBe(true)
    })

    test('Step should return false', async () => {
        await expect(automata.step([],[])).resolves.toBe(false)
    })

    test('Step should throw a "StateError"', async () => {
        await expect(automata2.step([],[])).rejects.toThrow(StateError)
    })

    test('StepAfterTimeout should return false', async () => {
        await expect(automata.stepAfterTimeout(1000, [])).resolves.toBe(false)
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000)
    })
})