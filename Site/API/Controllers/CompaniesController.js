import { 
    getAllCompaniesService, 
    getCompaniesByIdService, 
    createCompaniesService, 
    updateCompaniesByIdService, 
    deleteCompaniesByIdService
} from "../Models/CompaniesModel.js";

// Standardized repsonse function
const handleResponse = (res, status, message, data = null) => {
    res.status(status).json({
        status, message, data
    });
};

// Every CRUD controlled response

export const getAllCompanies = async (req, res, next) => {
    try {
        const allCompanies = await getAllCompaniesService();
        handleResponse(res, 200, "Companiess fetched successfully", allCompanies)
    } catch (error) {
        next(error);
    }
}

export const getCompanies = async (req, res, next) => {
    try {
        const Companies = await getCompaniesByIdService(req.params.id);
        if(!Companies) return handleResponse(res, 404, "Companies not found")
        handleResponse(res, 200, "Companies fetched successfully", Companies)
    } catch (error) {
        next(error);
    }
}

export const createCompanies = async (req, res, next) => {
    const {name, siret, mail, password, business_sector, headquarters, web_site, description} = req.body;
    try {
        const newCompanies = await createCompaniesService({name, siret, mail, password, business_sector, headquarters, web_site, description});
        handleResponse(res, 201, "Companies created successfully", newCompanies)
    } catch (error) {
        next(error);
    }
}

export const updateCompanies = async (req, res, next) => {
    const {name, siret, mail, password, business_sector, headquarters, web_site, description} = req.body
    try {
        const updatedCompanies = await updateCompaniesByIdService(req.params.id, name, siret, mail, password, business_sector, headquarters, web_site, description);
        if(!updatedCompanies) return handleResponse(res, 404, "Companies not found")
        handleResponse(res, 200, "Companies updated successfully", updatedCompanies)
    } catch (error) {
        next(error);
    }
}

export const deleteCompanies = async (req, res, next) => {
    try {
        const deletedCompanies = await deleteCompaniesByIdService(req.params.id);
        if(!deletedCompanies) return handleResponse(res, 404, "Companies not found")
        handleResponse(res, 200, "Companies deleted successfully", deletedCompanies)
    } catch (error) {
        next(error);
    }
}