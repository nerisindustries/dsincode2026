
from flask import Flask, Response
import pygetwindow as gw
import mss
from PIL import Image
from io import BytesIO
import time

app = Flask(__name__)


VIDEO_X = 10
VIDEO_Y = 100
VIDEO_WIDTH = 900
VIDEO_HEIGHT = 500

@app.route("/")
def home():
    return "Transmissao local do VMS ativa."

@app.route("/stream")
def stream():
    def generate():
        with mss.mss() as captura:
            while True:
                try:
                    janelas = [
                        janela for janela in gw.getAllWindows()
                        if "vms" in janela.title.lower()
                        and janela.width > 0
                        and janela.height > 0
                    ]

                    if not janelas:
                        time.sleep(1)
                        continue

                    janela = janelas[0]

                    regiao = {
                        "left": janela.left + VIDEO_X,
                        "top": janela.top + VIDEO_Y,
                        "width": VIDEO_WIDTH,
                        "height": VIDEO_HEIGHT
                    }

                    imagem = captura.grab(regiao)
                    imagem = Image.frombytes(
                        "RGB",
                        imagem.size,
                        imagem.rgb
                    )

                    buffer = BytesIO()
                    imagem.save(buffer, format="JPEG", quality=80)
                    quadro = buffer.getvalue()

                    yield (
                        b"--frame\r\n"
                        b"Content-Type: image/jpeg\r\n\r\n"
                        + quadro
                        + b"\r\n"
                    )

                    time.sleep(0.067)

                except Exception as erro:
                    print("Erro na captura:", erro)
                    time.sleep(1)

    return Response(
        generate(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )

if __name__ == "__main__":
    print("VMS Stream: http://127.0.0.1:5000/stream")
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False,
        threaded=True
    )
