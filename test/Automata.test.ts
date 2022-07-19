import { Automata, State, StateError, Transition } from "../src/Automata";
//@ts-ignore
import {toHaveBeenCalledBefore, toHaveBeenCalledAfter} from '../node_modules/jest-extended'
expect.extend({toHaveBeenCalledBefore, toHaveBeenCalledAfter});

const enteringMock = jest.fn()
const leavingMock = jest.fn()
const fromState: State<number> = { label: 0, isFinal: false, leavingHook:leavingMock, enteringHook:enteringMock }
const toState: State<number> = { label: 1, isFinal: false, enteringHook:enteringMock }
const evt = jest.fn().mockReturnValue(true)
const act = jest.fn()
const transition = new Transition(fromState, toState, evt, act)

describe('State', () => {
    test('Should be defined', () => {
        const state = new State(0, leavingMock, enteringMock, false)
        const state2 = new State(0)
        expect(state).toEqual(fromState)
        expect(state2).toEqual({label:0, isFinal: false})
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
    const middleState: State<number> = { label: 2, isFinal: false}
    const finalState: State<number> = { label: 3, isFinal: true }
    const middleTransition = new Transition(toState, middleState, evt, act)
    const finalTransition = new Transition(middleState, finalState, evt)
    const wrongTransition = new Transition(toState, { label: 5, isFinal: false}, () => true, null)
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
})