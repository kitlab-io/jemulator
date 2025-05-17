import { Behaviour } from "@needle-tools/engine";

export class PrintNumberComponent extends Behaviour {
    // @property({ type: Number })
    numberToPrint: number = 0;

    start() {
        console.log("PrintNumberComponent start", this);
        console.log(window)
        console.log("Number to print: " + this.numberToPrint);
        this.printNumber(this.numberToPrint);
    }

    private printNumber(myNumber: number) {
        console.log("My Number is: " + myNumber);
    }

    public setNumber(number: number) {
        this.numberToPrint = number;
        console.log("setNumber to print: " + this.numberToPrint);
    }
}