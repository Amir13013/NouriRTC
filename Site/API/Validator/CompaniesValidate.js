import Joi from "joi";

const CompaniesSchema = Joi.object({
    name: Joi.string().min(3).required(),
    siret: Joi.string().min(3).required(),
    mail: Joi.string().email().required(),
    business_sector: Joi.string().min(3).required(),
    headquarters: Joi.string().min(3).required(),
    web_site: Joi.string().min(3).required(),
    headquarters: Joi.string().min(3).required(),

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

const validationCompanies =(req, res, next) => {
    const {error} = CompaniesSchema.validate(req.body,{abortEarly: false});
    if (error) return res.status(400).json({
        status: 400 ,
        message: error.details.map(e => e.message)
    });
    next()
};

export default validationCompanies;