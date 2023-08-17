FROM node:16

# Creating an app directory.
WORKDIR /app

# Installing app dependencies.
# Isolating dependencies and rest of other files make to build faster.
COPY package*.json ./

RUN npm install --legacy-peer-deps

# Copying rest of the applications to app directory.
COPY . .

# Exposing the port and starting the application.
Expose 3000

CMD ["npm", "start"]

