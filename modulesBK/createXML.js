const { response } = require('express');
const crypto = require('crypto');
const fs = require('fs');
const xml2js = require('xml2js');
const archiver = require('archiver');
const path = require('path');

const generarHashSHA384 = (data) => {
  const hash = crypto.createHash('sha384'); // Especificamos SHA-384
  hash.update(data, 'utf8'); // Actualizamos con los datos que queremos hashear
  return hash.digest('hex'); // Obtenemos el hash en formato hexadecimal
};

const createfilename = (FechaFactura, Nit, consecEnvio) => {
  digitYear = FechaFactura.slice(2, 4);
  const nit10d = Nit.toString().padStart(10, '0');
  hexSConsecutivo = consecEnvio.toString(16).padStart(8, '0');
  const nameXML = 'fv' + nit10d + '000' + digitYear + hexSConsecutivo + '.xml';
  const folderName = 'z' + nit10d + '000' + digitYear + hexSConsecutivo;
  return { nameXML, folderName };
};

const actualizaCUFE = (softCode, CUFE) => {
  // Ruta al archivo XML
  const xmlFilePath =
    'C:\\Users\\Usuario\\Documents\\Marinos\\FacturaBK\\xmlFiles\\InvoiceParaFirma.xml';

  fs.readFile(xmlFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error leyendo el archivo:', err);
      return;
    }

    // Parsear XML a JSON
    const parser = new xml2js.Parser();
    parser.parseString(data, (err, result) => {
      if (err) {
        console.error('Error parseando el XML:', err);
        return;
      }
      // console.log(
      //   result.Invoice['ext:UBLExtensions'][0]['ext:UBLExtension'][0][
      //     'ext:ExtensionContent'
      //   ][0]['sts:DianExtensions'][0]['sts:SoftwareSecurityCode'][0]._
      // );

      // Actualizar el valor de un nodo
      result.Invoice['cbc:UUID'][0]._ = CUFE;
      result.Invoice['ext:UBLExtensions'][0]['ext:UBLExtension'][0][
        'ext:ExtensionContent'
      ][0]['sts:DianExtensions'][0]['sts:SoftwareSecurityCode'][0]._ = softCode;

      // Convertir el JSON de nuevo a XML
      const builder = new xml2js.Builder();
      const updatedXML = builder.buildObject(result);
      // Guardar el XML actualizado en el archivo
      fs.writeFile(xmlFilePath, updatedXML, (err) => {
        if (err) {
          console.error('Error escribiendo el archivo:', err);
          return;
        }
        console.log('Archivo actualizado con el calculo del cufe.');
      });
    });
  });
};

function preparePem(pem) {
  return (
    pem
      // remove BEGIN/END
      .replace(/-----(BEGIN|END)[\w\d\s]+-----/g, '')
      // remove \r, \n
      .replace(/[\r\n]/g, '')
  );
}

function pem2der(pem) {
  pem = preparePem(pem);
  // convert base64 to ArrayBuffer
  const binBuffer = new Uint8Array(Buffer.from(pem, 'base64')).buffer;
  return binBuffer;
}

const crearZip = (nameXML, folderName) => {
  console.log('entrada en crearzip', nameXML, folderName);
  // Crear el flujo de salida y un objeto de archivo ZIP
  const outputPath =
    'C:\\Users\\Usuario\\Documents\\Marinos\\FacturaBK\\zips\\' + folderName;

  const output = fs.createWriteStream(outputPath + '.zip');

  const archive = archiver('zip');

  archive.pipe(output);

  const endXML = 'xmlFiles/' + nameXML;

  archive.append(fs.createReadStream(endXML), { name: nameXML });

  archive.finalize();
};

const convertirBase64 = async (rutaArchivo) => {
  await fs.readFile(rutaArchivo, (err, data) => {
    if (err) {
      console.error('Error al leer el archivo:', err);
      return;
    }
    console.log('data', data);
    // Convertir el contenido del archivo a Base64
    const contenidoBase64 = data.toString('base64');

    // Guardar el contenido Base64 en un nuevo archivo
    const rutaSalida = 'archivo_base64.txt';
    fs.writeFile(rutaSalida, contenidoBase64, (err) => {
      if (err) {
        console.error('Error al guardar el archivo Base64:', err);
        return;
      }
      console.log(`Archivo convertido a Base64 y guardado en: ${rutaSalida}`);
    });
  });
};
// Leer el contenido del archivo XML

module.exports = {
  generarHashSHA384,
  createfilename,
  actualizaCUFE,
  preparePem,
  pem2der,
  crearZip,
  convertirBase64,
};
