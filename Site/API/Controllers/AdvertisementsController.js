import { 
    getAllAdvertisementsService, 
    getAdvertisementsByBusinessSectorService,
    getAdvertisementsByCityService,
    createAdvertisementsService, 
    updateAdvertisementsByIdService, 
    deleteAdvertisementsByIdService
} from "../Models/AdvertisementsModel.js";

// Standardized repsonse function
const handleResponse = (res, status, message, data = null) => {
    res.status(status).json({
        status, message, data
    });
};

// Every CRUD controlled response

export const getAllAdvertisements = async (req, res, next) => {
    try {
        const allAdvertisements = await getAllAdvertisementsService();
        handleResponse(res, 200, "Users fetched successfully", allAdvertisements)
    } catch (error) {
        next(error);
    }
}

export const getAdvertisementsByBusinessSector = async (req, res, next) => {
    try {
        const Advertisements = await getAdvertisementsByBusinessSectorService(req.params.business_sector);
        if(!Advertisements) return handleResponse(res, 404, "Advertisements not found")
        handleResponse(res, 200, "Advertisements fetched successfully", Advertisements)
    } catch (error) {
        next(error);
    }
}

export const getAdvertisementsByCity = async (req, res, next) => {
    try {
        const Advertisements = await getAdvertisementsByCityService(req.params.city);
        if(!Advertisements) return handleResponse(res, 404, "Advertisements not found")
        handleResponse(res, 200, "Advertisements fetched successfully", Advertisements)
    } catch (error) {
        next(error);
    }
}

export const createAdvertisements = async (req, res, next) => {
    const {company_name, job_name , contract_type, business_sector, salary, city, adress, description} = req.body;
    try {
        const newAdvertisements = await createAdvertisementsService({id, company_name, job_name , contract_type, business_sector, salary, city, adress, description});
        handleResponse(res, 201, "Advertisements created successfully", newAdvertisements)
    } catch (error) {
        next(error);
    }
}

export const updateAdvertisements = async (req, res, next) => {
    const {id, company_name, job_name , contract_type, business_sector, salary, city, adress, description} = req.body
    try {
        const updatedAdvertisements = await updateAdvertisementsByIdService(req.params.id,{id, company_name, job_name , contract_type, business_sector, salary, city, adress, description});
        if(!updatedAdvertisements) return handleResponse(res, 404, "User not found")
        handleResponse(res, 200, "Advertisements updated successfully", updatedAdvertisements)
    } catch (error) {
        next(error);
    }
}

export const deleteAdvertisements = async (req, res, next) => {
    try {
        const deletedAdvertisements = await deleteAdvertisementsByIdService(req.params.id);
        if(!deletedAdvertisements) return handleResponse(res, 404, "Advertisements not found")
        handleResponse(res, 200, "Advertisements deleted successfully", deletedAdvertisements)
    } catch (error) {
        next(error);
    }
}