export type Agent = {
    name : string;
    title : string;
    office : string;
    officePhone : string;
    cell : string | null;
    image : string;
    featured : boolean;
};

export const agents: Agent[] = [
    {
        name : "John Savoretti",
        title : "Broker/Owner",
        office : "Smithtown",
        officePhone : "516-327-6400 x310",
        cell : null,
        image : "",
        featured : true,
    },
    {
        name : "Dennis Arango",
        title : "Associate Broker",
        office : "Franklin Square",
        officePhone : "516-327-6400",
        cell : null,
        image : "",
        featured : true,
    },
    {
        name : "Joe Romeo",
        title : "Lic. Real Estate Associate Broker",
        office : "Franklin Square",
        officePhone : " 516-327-6400 Ext353",
        cell : "516-870-6007",
        image : "",
        featured : true,
    },
    {
        name : "Louis Tullo",
        title : "Lic. Real Estate Salesperson",
        office : "Franklin Square",
        officePhone : "516-327-6400 x313",
        cell : "(516)721-7257",
        image : "",
        featured : false,
    },
    {
        name : "Yolanda Recio",
        title : "Lic. Real Estate Salesperson",
        office : "Franklin Square",
        officePhone : "516-327-6400 x331",
        cell : "(917)681-9690",
        image : "",
        featured : false,
    },
];