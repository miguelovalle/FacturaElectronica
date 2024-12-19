const { Router } = require('express');

const { envioDian } = require('../controlers/dianDocs');

const router = Router();

router.post('/', envioDian);

module.exports = router;
