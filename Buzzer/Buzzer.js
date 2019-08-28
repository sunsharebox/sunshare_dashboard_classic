/*
Mise en place du buzzer d'alerte en cas d'alarme
Fonctionnement : Le buzzer fonctionnera pendant deux secondes 3 fois puis s'arrêtera.
Buzzer à connecter sur la PIN 7. Dans le cas où vous souhaitez changer la PIN, changer la variable pin.
Source : https://github.com/JamesBarwell/rpi-gpio.js
*/



var gpio = require('../rpi-gpio');

var pin = 7; // Pin GPIO
var delay = 2000; // Délai 2s; si 3s alors var delay = 3000 etc
var count = 0;
var max   = 3; // Nombre de répétitions

gpio.setup(pin, gpio.DIR_OUT, on);

function on() {
    if (count >= max) {
        gpio.destroy(function() {
            console.log('Buzzer éteint');
        });
        return;
    }

    setTimeout(function() {
        console.log('Off');
        gpio.write(pin, 1, off);
        count += 1;
    }, delay);
}

function off() {
    setTimeout(function() {
        console.log('Buzzer On');
        gpio.write(pin, 0, on);
    }, delay);
