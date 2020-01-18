const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const {findConnections, sendMessage} = require('../websocket');

//index, show, store, update, destroy
module.exports = {
    async index(req, res) {
       const devs = await Dev.find();
       
       return res.json(devs);
    },

    async store (req, res) {
    const {github_username, techs, latitude, longitude} = req.body;

    let dev = await Dev.findOne({github_username});

    if(!dev) {

    const response = await axios.get(`https://api.github.com/users/${github_username}`);

    const {name = login, avatar_url, bio} = response.data;

    const techsArray = parseStringAsArray(techs);

    const location = {
        type: 'Point',
        coordinates: [longitude, latitude],
    };

    dev = await Dev.create({
        github_username,
        name,
        avatar_url,
        bio,
        techs: techsArray,
        location,
    })

    // filtrar as conexoes que estao no max 10km de distancia e que o novo dev tenha pelo menos 1 das tech 
    // filtradas

    const sendSocketMessageIo = findConnections(
        {latitude, longitude},
        techsArray,
    )

    sendMessage(sendSocketMessageIo, 'new-dev', dev);

    }

    return res.json(dev)
  },

  async destroy(req, res) {
      const {github_username} = req.body;
      
      await Dev.findOneAndDelete(github_username, (err) => {
        if(!err){
            return res.json({text: 'Deletado com sucesso!'})
        } else {
            console.log(err);
            return res.json(err);
        }
      });

  },

  async update(req, res) {
      const {github_username, techs, bio, latitude, longitude} = req.body;

      const techsArray = parseStringAsArray(techs);

      const dev = await Dev.findOneAndUpdate(github_username, {
          techs: techsArray,
          bio,
          latitude,
          longitude
      }, (err) => {
        if(!err) {
            return res.json(dev);
        } else {
            console.log(err);
            return res.json(err);
        }
      });

  }

};