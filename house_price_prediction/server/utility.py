import json
import pickle
import numpy as np
__locations = None
__data_columns = None
__model = None

# predict function
def predict_price(location, sqft, bath, bhk):
    # we will create a 0 array of size equal to the number of columns in our data
    try:
        loc_index = __data_columns.index(location.lower()) 
    except:
        loc_index = -1
    # create a numpy array of zeros with the same length as the number of columns in our data
    x = np.zeros(len(__data_columns))
    x[0] = sqft
    x[1] = bath
    x[2] = bhk
    # if the location index is greater than or equal to 0, we will set the value of that index to 1
    if loc_index >= 0:
        x[loc_index] = 1

    return round(__model.predict([x])[0], 2)

# get location names
def get_location_name():
    return __locations


def load_saved_location():
    print("Loading saved location...")

    global __locations
    global __data_columns
    global __model

    # Load columns
    with open("./server/art/columns.json", "r") as f:
        __data_columns = json.load(f)['data_columns']
        __locations = __data_columns[3:]

    # Load trained model
    with open("./server/art/model.pickle", "rb") as f:
        __model = pickle.load(f)

    print("Loading saved location done")


if __name__ == '__main__':
    load_saved_location()   # ✅ CALL FUNCTION
    print(get_location_name())
    print(" Predicted price for 1000 sqft, 2 bath, 2 bhk in 1st Phase JP Nagar is: ", predict_price('1st Phase JP Nagar', 1000, 2, 2))
    print(predict_price('1st Phase JP Nagar', 1000, 2, 2))
    print(predict_price('2nd Phase JP Nagar', 1000, 3, 3))
    print(predict_price('ambedkar nagar', 1000, 3, 3))