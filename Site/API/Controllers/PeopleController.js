import { 
    getAllPeopleService, 
    getPeopleByIdService, 
    createPeopleService, 
    updatePeopleByIdService, 
    deletePeopleByIdService
} from "../Models/PeopleModel.js";

// Standardized repsonse function
const handleResponse = (res, status, message, data = null) => {
    res.status(status).json({
        status, message, data
    });
};

// Every CRUD controlled response

export const getAllPeople = async (req, res, next) => {
    try {
        const allPeoples = await getAllPeopleService();
        handleResponse(res, 200, "Peoples fetched successfully", allPeoples)
    } catch (error) {
        next(error);
    }
}

export const getPeople = async (req, res, next) => {
    try {
        const People = await getPeopleByIdService(req.params.id);
        if(!People) return handleResponse(res, 404, "People not found")
        handleResponse(res, 200, "People fetched successfully", People)
    } catch (error) {
        next(error);
    }
}

export const createPeople = async (req, res, next) => {
    const {name, first_name, phone_number, mail, password, adress, city} = req.body;
    console.log("BODY RECU:", req.body);
    try {
        const newPeople = await createPeopleService(
            name,
            first_name,
            phone_number,
            mail,
            password,
            adress,
            city
        );
        handleResponse(res, 201, "People created successfully", newPeople);
    } catch (error) {
        next(error);
    }
};


export const updatePeople = async (req, res, next) => {
    const {name, first_name, phone_number, mail, password, adress, city} = req.body
    console.log(req.body);
    try {
        const updatedPeople = await updatePeopleByIdService(
            req.params.id,
            name,
            first_name,
            phone_number,
            mail,
            password,
            adress,
            city
        );
        if(!updatedPeople) return handleResponse(res, 404, "People not found")
        handleResponse(res, 200, "People updated successfully", updatedPeople)
    } catch (error) {
        next(error);
    }
}

export const deletePeople = async (req, res, next) => {
    try {
        const deletedPeople = await deletePeopleByIdService(req.params.id);
        if(!deletedPeople) return handleResponse(res, 404, "People not found")
        handleResponse(res, 200, "People deleted successfully", deletedPeople)
    } catch (error) {
        next(error);
    }
}