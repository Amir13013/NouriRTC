import Joi from "joi";

const PeopleSchema = Joi.object({
    name: Joi.string().min(3).required(),
    first_name: Joi.string().min(3).required(),
    phone_number: Joi.string().pattern(/^\d{10}$/).required(),
    mail: Joi.string().email().required(),
    adress: Joi.string().min(3).required(),
    city: Joi.string().min(3).required(),

    password: Joi.string()
        .min(8)
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).+$"))
        .required()
        .messages({
            "string.pattern.base": "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.",
            "string.min": "Le mot de passe doit contenir au moins 8 caractères.",
            "any.required": "Le mot de passe est requis."
        })
});

const validationPeople =(req, res, next) => {
    const {error} = PeopleSchema.validate(req.body);
    if (error) return res.status(400).json({
        status: 400 ,
        message: error.details[0].message
    });
    next()
};

export default validationPeople;