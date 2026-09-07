"""
Prueba el modelo ONNX de IsThisSpam contra casos conocidos.

Existe para responder dos preguntas antes de decidir nada: ¿distingue de
verdad una estafa de un mensaje normal, y entiende español o solo inglés?

Como no publicaron qué significa cada salida, se le pasan casos que ya
sabemos clasificar y se deduce el mapa mirando qué número sube y cuál baja.

    python3 probar.py
"""
import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

tok = Tokenizer.from_file("modelo/tokenizer.json")
ses = ort.InferenceSession("modelo/model.onnx")

print("entradas:", [i.name for i in ses.get_inputs()])
print("salidas: ", [(o.name, o.shape) for o in ses.get_outputs()])
print()

CASOS = [
    ("ESTAFA  principe", "Dear Friend, I am Prince Abacha of Nigeria. I have USD 25,000,000 and need your assistance to transfer this fund. Send your bank details and a processing fee of $500."),
    ("ESTAFA  cripto", "Hola! Soy analista de trading. Mis clientes ganan 15% semanal en cripto. Empeza con 200 dolares."),
    ("ESTAFA  romance", "Mi amor, estoy varado en el aeropuerto. Necesito 800 dolares para la aduana, te lo devuelvo."),
    ("ESTAFA  sextorsion", "Tengo grabaciones de tu camara. Si no depositas 500 dolares en 48 horas envio todo a tus contactos."),
    ("ESTAFA  banco EC", "Banco Pichincha: consumo de 340 dolares. Bloquee aqui: http://pichincha-seguro.net/bloqueo"),
    ("ESTAFA  soporte", "ALERTA DE MICROSOFT: Su computadora tiene 3 virus. Llame al 1-800-555-0199."),
    ("ESTAFA  abuelito", "Abuelita soy yo, tuve un accidente y estoy en la comisaria. No le digas a mis papas. Necesito 400 dolares urgente."),
    ("LEGITIMO reunion", "Hola, te confirmo la reunion de manana a las 10. Saludos."),
    ("LEGITIMO codigo", "Su codigo de verificacion de Google es 483920. No lo comparta con nadie."),
    ("LEGITIMO trabajo", "El presupuesto del proyecto es de 2.5 millones y el cliente aprobo la propuesta."),
    ("LEGITIMO banco", "Banco Pichincha: consumo aprobado por 45.20 en SUPERMAXI. Si no lo reconoce llame al 1700 100 100."),
    ("LEGITIMO cita", "Recordatorio: tu cita medica es el jueves a las 3 de la tarde."),
]

for etiqueta, texto in CASOS:
    e = tok.encode(texto)
    n = len(e.ids)
    feed = {}
    for entrada in ses.get_inputs():
        if "mask" in entrada.name:
            v = np.ones((1, n), dtype=np.int64)
        elif "type" in entrada.name:
            v = np.zeros((1, n), dtype=np.int64)
        else:
            v = np.array([e.ids], dtype=np.int64)
        feed[entrada.name] = v
    salida = ses.run(None, feed)[0][0]
    p = np.exp(salida - salida.max())
    p = p / p.sum()
    print(etiqueta.ljust(20), np.round(p, 3))

print()
print("Lee la columna que sube en las ESTAFA y baja en las LEGITIMO:")
print("esa es la probabilidad de fraude. Si no hay ninguna que se comporte")
print("asi, el modelo no distingue, o no entiende espanol.")
