import Joi from "joi";

export const jobSchema = Joi.object({
    nom_entreprise: Joi.string().required(),
    nom_job: Joi.string().required(),
    type_de_contrat: Joi.string().required(),
    secteur_activité: Joi.string().required(),
    salaire: Joi.number().required(),
    ville: Joi.string().required(),
    adresse: Joi.string().required(),
    date_de_postulation: Joi.date().required(),
    descriptif: Joi.string().required(),
});