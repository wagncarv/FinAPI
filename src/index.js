const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

const customers = []

//MIDDLEWARE
function vefifyIfExistsAccountCPF(request, response, next){
    const { cpf } = request.headers
    const customer = customers.find((customer) => customer.cpf == cpf)

    if(!customer){
        return response.status(400).json({error: "Customer not found"})
    }

    //passar dados para a request
    request.customer = customer
    return next()
}
//END MIDDLEWARE

app.post("/account", (request, response) => {
    const { cpf, name } = request.body

    const customersExists = customers.some((customer) => customer.cpf === cpf)

    if(customersExists){
        return response.status(400).json({error: "Customer already exists"})
    }

    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })

    return response.status(201).send({message: "created"})
})

/**
    1 - Ao utilizar app.use(vefifyIfExistsAccountCPF), todas as rotas abaixo da chamada
    passarão pelo middleware
    2 - Ao utilizar app.get("/statement", vefifyIfExistsAccountCPF, (request, response) =>,
    apenas esta rota passará pelo middleware
 */
// app.use(vefifyIfExistsAccountCPF)

app.get("/statement", vefifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request
    return response.json(customer.statement)
})

app.post("/deposit", vefifyIfExistsAccountCPF, (request, response) =>{
    const { description, amount } = request.body
    const { customer } = request

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation)
})

app.listen(3333)