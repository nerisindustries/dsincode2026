
void setup() {
    Serial.begin(9600);

    pinMode(8, OUTPUT);
    pinMode(9, OUTPUT);
    pinMode(10, OUTPUT);

    pinMode(2, OUTPUT);
    pinMode(3, OUTPUT);
    pinMode(4, OUTPUT);
}

void loop() {
    digitalWrite(8, HIGH);
    digitalWrite(10, LOW);
    digitalWrite(9, LOW);

    digitalWrite(2, LOW);
    digitalWrite(3, LOW);
    digitalWrite(4, HIGH);

    esperar(4000);

    digitalWrite(8, LOW);
    digitalWrite(10, HIGH);

    esperar(2000);

    digitalWrite(10, LOW);
    digitalWrite(9, HIGH);

    esperar(1000);

    digitalWrite(2, HIGH);
    digitalWrite(3, LOW);
    digitalWrite(4, LOW);

    esperar(4000);

    digitalWrite(2, LOW);
    digitalWrite(3, HIGH);

    esperar(2000);

    digitalWrite(3, LOW);
    digitalWrite(4, HIGH);

    esperar(1000);
}

void esperar(unsigned long tempo) {
    unsigned long inicio = millis();
    unsigned long ultimoAviso = millis();

    while (millis() - inicio < tempo) {
        if (millis() - ultimoAviso >= 1000) {
            Serial.println("SEMAFORO_OK");
            ultimoAviso = millis();
        }
    }
}
