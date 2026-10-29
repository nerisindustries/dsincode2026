
const int TRIG_R1 = 2;
const int ECHO_R1 = 3;
const int TRIG_R2 = 4;
const int ECHO_R2 = 5;

const int LIMITE_DISTANCIA = 10;
const unsigned long TEMPO_LIMITE = 400;
const unsigned long TEMPO_MINIMO = 70;
const int LEITURAS_CONFIRMACAO = 3;

struct Radar {
  int trig;
  int echo;
  const char* nome;
  bool detectando;
  bool multaEnviada;
  unsigned long inicio;
  int leiturasDentro;
  int leiturasFora;
};

Radar radar1 = {TRIG_R1, ECHO_R1, "RADAR1", false, false, 0, 0, 0};
Radar radar2 = {TRIG_R2, ECHO_R2, "RADAR2", false, false, 0, 0, 0};

void setup() {
  Serial.begin(9600);

  pinMode(TRIG_R1, OUTPUT);
  pinMode(ECHO_R1, INPUT);
  pinMode(TRIG_R2, OUTPUT);
  pinMode(ECHO_R2, INPUT);
}

void loop() {
  verificarRadar(radar1);
  verificarRadar(radar2);
  delay(30);
}

int pegarDistancia(int trig, int echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(2);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  unsigned long duracao = pulseIn(echo, HIGH, 20000);

  if (duracao == 0) {
    return -1;
  }

  return duracao * 0.0343 / 2;
}

void verificarRadar(Radar &r) {
  int distancia = pegarDistancia(r.trig, r.echo);
  bool presente = distancia > 0 && distancia < LIMITE_DISTANCIA;

  if (!r.detectando) {
    if (presente) {
      r.leiturasDentro++;

      if (r.leiturasDentro >= LEITURAS_CONFIRMACAO) {
        r.detectando = true;
        r.inicio = millis();
        r.leiturasFora = 0;
      }
    } else {
      r.leiturasDentro = 0;
    }

    return;
  }

  if (presente) {
    r.leiturasFora = 0;
    return;
  }

  r.leiturasFora++;

  if (r.leiturasFora < LEITURAS_CONFIRMACAO) {
    return;
  }

  unsigned long duracao = millis() - r.inicio;

  if (duracao >= TEMPO_MINIMO && duracao < TEMPO_LIMITE) {
    Serial.print(r.nome);
    Serial.println("_MULTA");
  } else {
    Serial.print(r.nome);
    Serial.println("_NORMAL");
  }

  r.detectando = false;
  r.leiturasDentro = 0;
  r.leiturasFora = 0;
  r.multaEnviada = false;
}
