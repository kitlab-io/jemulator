import { Behaviour } from "@needle-tools/engine";
import { CarController } from "@needle-tools/car-physics";

export class RCCarController extends Behaviour {

    carController!: CarController;
    motorSpeed: number = 0;
    label: string = "RCCarController";
    actionInterval:any = null;

    start() {
        this.carController = this.gameObject.getComponent(CarController)!;
        this.register();
        
        console.log("RCCarController start!", this);
        console.log(window)
        console.log("Motor speed: " + this.motorSpeed);
    }

    public register() {
        if (!window[this.label]) {
            window[this.label] = this;
        }
    }

    public setConstantMotorSpeed(speed: number) {
        if (this.actionInterval) {
            clearInterval(this.actionInterval);
        }
        this.actionInterval = setInterval(() => {
            // Needle.Context.Current.scripts[123].carPhysics.accelerationImpulse(1)
            this.carController.carPhysics?.accelerationImpulse(speed);
        }, 10);
    }

    public stopConstantMotorSpeed() {
        clearInterval(this.actionInterval);
        this.actionInterval = null;
    }

    public setMotorSpeed(speed: number) {
        this.motorSpeed = speed;
        console.log("setMotorSpeed to: " + this.motorSpeed);
    }
}