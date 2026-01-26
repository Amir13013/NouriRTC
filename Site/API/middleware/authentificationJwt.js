import jwt from "jasonWebtoken";

app.get('/jwt', (req, res) => {
  const createTokenFromJason = (jasonData, secretKeys, options = {}) => {
    try{
      const jwt = jwt.sign (jasonData, secretKeys, options)
    }catch(error){
      console.log ("Error: ", error.message)
      return null ;
    }
  } 

  const jsonData = { name:"Jhon", mail: 'user@toto.com' }; 
  const secretKey = 'tonSecretSuperSecurise';

  const token = createTokenFromJason (jasonData, secretKeys)
  res.json();
    if (token) {
      res.json({ token });
    } else {
      res.status(500).json({ error: 'Erreur lors de la création du token' });
    }
});