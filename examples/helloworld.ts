import { action, Automata, State, Transition } from '../src/Automata'

const states: State<number>[] = [
    {label: 0, isFinal: false},
    {label: 1, isFinal: false},
    {label: 2, isFinal: false},
    {label: 3, isFinal: false},
    {label: 4, isFinal: false},
    {label: 5, isFinal: false},
    {label: 6, isFinal: false},
    {label: 7, isFinal: false},
    {label: 8, isFinal: false},
    {label: 9, isFinal: false},
    {label: 10, isFinal: false},
    {label: 11, isFinal: true},
]
const printChar: action = (label: number) => {
    nextStateNumber++
    switch(label){
        case 0:
            console.log('H')
            break
        case 1:
            console.log('e')
            break
        case 2:
        case 3:
        case 9:
            console.log('l')
            break
        case 4:
        case 7:
            console.log('o')
            break
        case 5:
            console.log('\n')
            break
        case 6:
            console.log('W')
            break
        case 8:
            console.log('r')
            break
        case 10:
            console.log('d')
            break
        default:
            break
    }
    return
}

const evtCheck = (x: number, y: number): boolean =>  {
    return x == (++y)
}

let nextStateNumber = 1
const transitions: Transition<number, number>[] = [
    new Transition(states[0], states[1], evtCheck, printChar),
    new Transition(states[1], states[2], evtCheck, printChar),
    new Transition(states[2], states[3], evtCheck, printChar),
    new Transition(states[3], states[4], evtCheck, printChar),
    new Transition(states[4], states[5], evtCheck, printChar),
    new Transition(states[5], states[6], evtCheck, printChar),
    new Transition(states[6], states[7], evtCheck, printChar),
    new Transition(states[7], states[8], evtCheck, printChar),
    new Transition(states[8], states[9], evtCheck, printChar),
    new Transition(states[9], states[10], evtCheck, printChar),
    new Transition(states[10], states[11], evtCheck, printChar),
]
const HelloPrinter = new Automata(states[0], states, transitions)
async function main() {
    let stepDone: boolean = true
    while(!HelloPrinter.done() && stepDone && nextStateNumber < 12) {
        stepDone = (await HelloPrinter.step([nextStateNumber, HelloPrinter.CurrentState.label], [HelloPrinter.CurrentState.label]))
    }
}

main()