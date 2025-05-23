import { Behaviour } from "@needle-tools/engine";
import { CarController } from "needle.samples.carphysics/CarController";

export class RCCarController extends Behaviour {

    carController!: CarController;
    motorSpeed: number = 0;
    batteryLevel: number = 100;
    temperature: number = 25;
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

    public setSteering(angle: number) {
        // this.carController.carPhysics?.steeringAngle = angle;
    }

    public setConstantMotorSpeed(speed: number) {
        if (this.actionInterval) {
            clearInterval(this.actionInterval);
        }
        this.actionInterval = setInterval(() => {
            // Needle.Context.Current.scripts[123].carPhysics.accelerationImpulse(1)
            this.carController.carPhysics?.accelerationInput(speed);
            
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

    public setBatteryLevel(level: number) {
        this.batteryLevel = level;
        console.log("Battery level updated to: " + this.batteryLevel + "%");
        
        // Optional: Implement visual feedback for battery level
        // For example, change car lights intensity based on battery level
        if (this.batteryLevel < 20) {
            // Low battery warning
            this.lowBatteryWarning(true);
        } else {
            this.lowBatteryWarning(false);
        }
    }

    public setTemperature(temp: number) {
        this.temperature = temp;
        console.log("Temperature updated to: " + this.temperature + "°C");
        
        // Optional: Implement visual feedback for temperature
        // For example, show smoke particles if temperature is too high
        if (this.temperature > 50) {
            this.highTemperatureWarning(true);
        } else {
            this.highTemperatureWarning(false);
        }
    }

    private lowBatteryWarning(active: boolean) {
        // Implement visual feedback for low battery
        // This could be implemented to flash lights or change car color
        console.log("Low battery warning: " + active);
    }

    private highTemperatureWarning(active: boolean) {
        // Implement visual feedback for high temperature
        // This could be implemented to show smoke particles or change engine color
        console.log("High temperature warning: " + active);
    }
}