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

function getBalance(statement){
   const balance =  statement.reduce((acc, operation) => {
       if(operation.type == 'credit'){
           return acc + operation.amount

       }else{
        return acc - operation.amount
       }

   }, 0)
    return balance
}

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

app.get("/statement/date", vefifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request
    const { date } = request.query
    const dateFormat = new Date(date + " 00:00")
   
    const statement = customer.statement.filter(
        (statement) =>
        statement.created_at.toDateString() === 
        new Date(dateFormat).toDateString()
    );

    return response.json(statement)
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
    return response.status(201).send({message: `Deposited $ ${amount}`})
})

app.post("/withdraw", vefifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body
    const { customer } = request
    const balance = getBalance(customer.statement)

    if(balance < amount){
        return response.status(400).json({error: "Insufficient funds"}) 
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: 'debit'
    }

    customer.statement.push(statementOperation)

    return response.status(201).send({message: `You withdrew $${amount}`})
})

app.put("/account", vefifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body
    const { customer } = request
    customer.name = name

    return response.status(201).send({message: `name changed to ${name}`})
})

app.get("/account", vefifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request
    return response.json(customer)
})

app.delete("/account", vefifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request
    customers.splice(customers.indexOf(customer), 1)

    return response.status(200).json(customers)
});

app.listen(3333)