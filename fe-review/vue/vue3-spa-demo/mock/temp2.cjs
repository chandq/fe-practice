module.exports = {
  '/mock/service/aa': {
    aa: 1,
    bb: 'ss'
  },
  '/mock/service/bb': (req, res) => {
    res.json(55);
  }
};

