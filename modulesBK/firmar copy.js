const fs = require('fs');
var { Crypto } = require('@peculiar/webcrypto');
const xadesjs = require('xadesjs');
const { XMLSerializer } = require('@xmldom/xmldom');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { preparePem, pem2der } = require('./createXML');
const crypto = new Crypto();
xadesjs.Application.setEngine('NodeJS', new Crypto());

//const idForDocument = `xmldsig-${uuidv4()}`;
const idForSignature = `xmldsig-${uuidv4()}`;
const idForKeyInfo = `xmldsig-${uuidv4()}-keyinfo`;
const idForSignatureValue = `${idForSignature}-sigvalue`;
const idForSignedProperties = `${idForSignature}-signedprops`;

const signfile = async (nombreArhivo) => {
  const hash = 'SHA-256';
  const alg = {
    name: 'RSASSA-PKCS1-v1_5',
    hash,
  };

  // Read cert
  const certPem = fs.readFileSync('./andes/certificate.pem', {
    encoding: 'utf8',
  });

  // Read private key
  const keyPem = fs.readFileSync('./andes/private_key.pem', {
    encoding: 'utf8',
  });

  const keyDer = pem2der(keyPem);
  const key = await crypto.subtle.importKey('pkcs8', keyDer, alg, true, [
    'sign',
  ]);

  // read public key
  const publicPem = fs.readFileSync('./andes/public_key.pem', {
    encoding: 'utf8',
  });
  const publicDer = pem2der(publicPem);

  const publicKey = await crypto.subtle.importKey(
    'spki',
    publicDer,
    alg,
    true,
    ['verify']
  );

  // Read inovoice
  var xmlString = await fs.readFileSync(
    './xmlFiles/invoiceParaFirma.xml',
    'utf-8'
  );

  var xml = xadesjs.Parse(xmlString);

  var xadesXml = new xadesjs.SignedXml();
  const x509 = preparePem(certPem);

  // Signing document
  const signature = await xadesXml.Sign(
    alg, // algorithm
    key, // key
    xml, // document
    {
      // options
      id: idForSignature,
      keyvalue: publicKey,
      x509: [x509],
      references: [
        {
          id: `${idForSignature}-ref0`,
          uri: '',
          hash,
          transforms: ['enveloped'],
        },
        {
          uri: idForKeyInfo,
          hash,
        },
      ],
      signingCertificate: x509,
      signingTime: { value: new Date(), format: 'yyyy-MM-ddTHH:mm:ss:ms Z' },
      policy: {
        hash,
        identifier: {
          value:
            'https://facturaelectronica.dian.gov.co/politicadefirma/v1/politicadefirmav2.pdf',
        },
      },
      signerRole: { claimed: ['supplier'] },
    }
  );
  // obtener el xml de la firma
  const nodeSign = signature.GetXml();

  // Asignar el ID a KeyInfo
  nodeSign
    .getElementsByTagName('ds:KeyInfo')[0]
    .setAttribute('Id', idForKeyInfo);

  // Asignar el ID a SignatureValue
  nodeSign
    .getElementsByTagName('ds:SignatureValue')[0]
    .setAttribute('Id', idForSignatureValue);

  // Cambiar el Id de SignedProperties
  nodeSign
    .getElementsByTagName('xades:SignedProperties')[0]
    .setAttribute('Id', idForSignedProperties);

  // Cambiar el URI de la tercera referencia
  nodeSign
    .getElementsByTagName('ds:Reference')[2]
    .setAttribute('URI', idForSignedProperties);

  //cambiar el Target de xades:QualifyingProperties
  nodeSign
    .getElementsByTagName('xades:QualifyingProperties')[0]
    .setAttribute('Target', idForSignature);

  // Obtener el segundo nodo /ext:UBLExtensions/ext:UBLExtension/ext:ExtensionContent
  const ublExtensions = xml.getElementsByTagName('ext:UBLExtension')[1]; // Obtener el segundo UBLExtension
  const extensionContent = xml.getElementsByTagName('ext:ExtensionContent')[1]; // Obtener el nodo ExtensionContent

  extensionContent.appendChild(nodeSign);

  // serialize XML
  const oSerializer = new XMLSerializer();
  const sXML = oSerializer.serializeToString(xml);

  // Guardar el documento firmado
  fs.writeFileSync(`./xmlFiles/${nombreArhivo}.xml`, sXML, 'utf-8');

  console.log('documento guardado');
};

module.exports = { signfile };
