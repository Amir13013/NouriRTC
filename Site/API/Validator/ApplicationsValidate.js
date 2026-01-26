import Joi from "joi";

export const ApplicationsSchema = Joi.object({
    name: Joi.string().required(),
    mail: Joi.string().required(),
    cover_letter: Joi.string().required(),
    application_status: Joi.date().required(),
});