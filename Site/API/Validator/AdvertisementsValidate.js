import Joi from "joi";

export const AdvertisementsSchema = Joi.object({
    company_name: Joi.string().required(),
    job_name: Joi.string().required(),
    contract_type: Joi.string().required(),
    business_sector: Joi.string().required(),
    salary: Joi.number().required(),
    city: Joi.string().required(),
    adress: Joi.string().required(),
    description: Joi.string().required(),
});