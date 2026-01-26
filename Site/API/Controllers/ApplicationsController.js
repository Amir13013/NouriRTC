import { 
    getAllApplicationsService, 
    getApplicationsByIdService, 
    createApplicationsService, 
    updateApplicationsByIdService, 
    deleteApplicationsByIdService
} from "../Models/ApplicationsModel.js";

// Standardized repsonse function
const handleResponse = (res, status, message, data = null) => {
    res.status(status).json({
        status, message, data
    });
};

// Every CRUD controlled response

export const getAllApplications = async (req, res, next) => {
    try {
        const allApplications = await getAllApplicationsService();
        handleResponse(res, 200, "Applicationss fetched successfully", allApplications)
    } catch (error) {
        next(err);
    }
}

export const getApplications = async (req, res, next) => {
    try {
        const Applications = await getApplicationsByIdService(req.params.id);
        if(!Applications) return handleResponse(res, 404, "Applications not found")
        handleResponse(res, 200, "Applications fetched successfully", Applications)
    } catch (error) {
        next(err);
    }
}

export const createApplications = async (req, res, next) => {
    const {name, mail, cover_letter, application_status} = req.body;
    try {
        const newApplications = await createApplicationsService(name, mail, cover_letter, application_status);
        handleResponse(res, 200, "Applications created successfully", newApplications)
    } catch (err) {
        next(err);
    }
}

export const updateApplications = async (req, res, next) => {
    const {name, mail, cover_letter, application_status} = req.body
    try {
        const updatedApplications = await updateApplicationsByIdService(req.params.id, name, mail, cover_letter, application_status);
        if(!updatedApplications) return handleResponse(res, 404, "Applications not found")
        handleResponse(res, 200, "Applications updated successfully", updatedApplications)
    } catch (error) {
        next(err);
    }
}

export const deleteApplications = async (req, res, next) => {
    try {
        const deletedApplications = await deleteApplicationsByIdService(req.params.id);
        if(!deletedApplications) return handleResponse(res, 404, "Applications not found")
        handleResponse(res, 200, "Applications deleted successfully", deletedApplications)
    } catch (error) {
        next(err);
    }
}