import { defaultAbiCoder } from "ethers/lib/utils";
import {
    SchemaElement,
    SynteticTypedData,
    SynteticTypedDataEncoded
} from "./types";
import { encodeAttestData, encodeSchema } from "./util";
//Typed attestations schemas
export const idSchema: SchemaElement[] = [
    {
        name: "Образование",
        dataType: "",
        childs: [
            {
                name: "Уровень",
                dataType: "string",
                childs: []
            },
            {
                name: "Название",
                dataType: "string",
                childs: []
            },
            {
                name: "Год окончания",
                dataType: "uint16",
                childs: []
            },
            {
                name: "Специальность",
                dataType: "",
                childs: [
                    {
                        name: "Название",
                        dataType: "string",
                        childs: []
                    },
                    {
                        name: "Код",
                        dataType: "uint16",
                        childs: []
                    }
                ]
            }
        ]
    }
];

export const idTestingData = {
    Образование: {
        Уровень: "Высшее",
        Название: "МГУ",
        "Год окончания": 2020,
        Специальность: {
            Название: "Программная инженерия",
            Код: 123
        }
    }
};

const onlineCourseSchema: SchemaElement[] = [
    {
        name: "Курс",
        dataType: "",
        childs: [
            {
                name: "Название",
                dataType: "string",
                childs: []
            },
            {
                name: "Организация",
                dataType: "string",
                childs: []
            },
            {
                name: "URL",
                dataType: "string",
                childs: []
            }
        ]
    },
    {
        name: "Результаты",
        dataType: "",
        childs: [
            {
                name: "Дата окончания",
                dataType: "uint256",
                childs: []
            },
            {
                name: "Оценка",
                dataType: "uint8",
                childs: []
            },
            {
                name: "Сертификат",
                dataType: "string",
                childs: []
            }
        ]
    }
];

const communityMemberSchema: SchemaElement[] = [
    {
        name: "Участник",
        dataType: "",
        childs: [
            {
                name: "Ник",
                dataType: "string",
                childs: []
            },
            {
                name: "Роль",
                dataType: "string",
                childs: []
            },
            {
                name: "Дата вступления",
                dataType: "uint256",
                childs: []
            }
        ]
    }
];

const iqTestSchema: SchemaElement[] = [
    {
        name: "Тест",
        dataType: "",
        childs: [
            {
                name: "Название",
                dataType: "string",
                childs: []
            },
            {
                name: "Организация",
                dataType: "string",
                childs: []
            },
            {
                name: "URL",
                dataType: "string",
                childs: []
            }
        ]
    },
    {
        name: "Результаты",
        dataType: "",
        childs: [
            {
                name: "Дата прохождения",
                dataType: "uint256",
                childs: []
            },
            {
                name: "Баллы",
                dataType: "uint16",
                childs: []
            },
            {
                name: "Уровень IQ",
                dataType: "uint8",
                childs: []
            }
        ]
    }
];

const realEstateSchema: SchemaElement[] = [
    {
        name: "Недвижимость",
        dataType: "",
        childs: [
            {
                name: "Тип",
                dataType: "string",
                childs: []
            },
            {
                name: "Адрес",
                dataType: "string",
                childs: []
            },
            {
                name: "Площадь",
                dataType: "uint16",
                childs: []
            },
            {
                name: "Стоимость",
                dataType: "uint256",
                childs: []
            }
        ]
    }
];

const clubMemberSchema: SchemaElement[] = [
    {
        name: "Клуб",
        dataType: "",
        childs: [
            {
                name: "Название",
                dataType: "string",
                childs: []
            },
            {
                name: "Описание",
                dataType: "string",
                childs: []
            },
            {
                name: "URL",
                dataType: "string",
                childs: []
            }
        ]
    },
    {
        name: "Член клуба",
        dataType: "",
        childs: [
            { name: "Email", dataType: "string", childs: [] },
            {
                name: "Дата вступления",
                dataType: "uint256",
                childs: []
            }
        ]
    }
];

const articleSchema: SchemaElement[] = [
    {
        name: "Статья",
        dataType: "",
        childs: [
            { name: "Название", dataType: "string", childs: [] },
            { name: "Аннотация", dataType: "string", childs: [] },
            {
                name: "Ключевые слова",
                dataType: "string[]",
                childs: []
            },
            { name: "URL", dataType: "string", childs: [] }
        ]
    },
    {
        name: "Авторы",
        dataType: "",
        childs: [
            {
                name: "Автор1",
                dataType: "",
                childs: [
                    { name: "Имя", dataType: "string", childs: [] },
                    { name: "Email", dataType: "string", childs: [] }
                ]
            },
            {
                name: "Автор2",
                dataType: "",
                childs: [
                    { name: "Имя", dataType: "string", childs: [] },
                    { name: "Email", dataType: "string", childs: [] }
                ]
            }
        ]
    }
];

//Typed attestations testing data
const onlineCourseSchemaData = {
    body: {
        Курс: {
            Название: "Курс по программированию",
            Организация: "Яндекс",
            URL: "https://yandex.ru"
        },
        Результаты: {
            "Дата окончания": 1234567890,
            Оценка: 100,
            Сертификат: "АБВГ1501506"
        }
    },
    expiriable: false
};

const communityMemberSchemaData = {
    body: {
        Участник: {
            Ник: "CoolTester",
            Роль: "Тестировщик",
            "Дата вступления": 1234567890
        }
    },
    expiriable: true
};

const iqTestSchemaData = {
    body: {
        Тест: {
            Название: "IQ Test",
            Организация: "IQ Test Org",
            URL: "https://iqtest.org"
        },
        Результаты: {
            "Дата прохождения": 1234567890,
            Баллы: 118,
            "Уровень IQ": 155
        }
    },
    expiriable: true
};

const realEstateSchemaData = {
    body: {
        Недвижимость: {
            Тип: "Квартира",
            Адрес: "Москва, ул. Ленина, д. 1",
            Площадь: 100,
            Стоимость: 1000000
        }
    },
    expiriable: true
};

const clubMemberSchemaData = {
    body: {
        Клуб: {
            Название: "Клуб любителей кошек",
            Описание: "Клуб любителей кошек",
            URL: "https://cats.ru"
        },
        "Член клуба": {
            Email: "admin@cats.ru",
            "Дата вступления": 1234567890
        }
    },
    expiriable: true
};

const articleSchemaData = {
    body: {
        Статья: {
            Название: "Статья о блокчейне",
            Аннотация: "Статья о блокчейне",
            "Ключевые слова": ["Блокчейн", "Криптовалюты"],
            URL: "https://blockchain.ru"
        },
        Авторы: {
            Автор1: {
                Имя: "Виталик",
                Email: "buterin@ethereum.org"
            },
            Автор2: {
                Имя: "Сатоши",
                Email: "satoshi@bitcoin.org"
            }
        }
    },
    expiriable: false
};

const govermentTypedData: SynteticTypedData[] = [
    {
        schema: { name: "Недвижимость", schema: realEstateSchema },
        data: realEstateSchemaData
    },
    {
        schema: { name: "Информация о пользователе", schema: idSchema },
        data: { body: idTestingData, expiriable: true }
    }
];

const organisationTypedData: SynteticTypedData[] = [
    {
        schema: { name: "Онлайн курс", schema: onlineCourseSchema },
        data: onlineCourseSchemaData
    },
    {
        schema: { name: "Статья", schema: articleSchema },
        data: articleSchemaData
    }
];

const communityTypedData: SynteticTypedData[] = [
    {
        schema: { name: "Участие в сообществе", schema: communityMemberSchema },
        data: communityMemberSchemaData
    },

    {
        schema: { name: "Участник клуба", schema: clubMemberSchema },
        data: clubMemberSchemaData
    },

    {
        schema: { name: "IQ-тест", schema: iqTestSchema },
        data: iqTestSchemaData
    }
];
export const getSynteticTypedData = (
    govermentAddress: string,
    organisationAddress: string,
    communityAddress: string
): { [key: string]: SynteticTypedDataEncoded[] } => {
    const keys = [govermentAddress, organisationAddress, communityAddress];
    const values = [
        govermentTypedData,
        organisationTypedData,
        communityTypedData
    ].map((typedArray) =>
        typedArray.map((typed) => ({
            name: typed.schema.name,
            schemaEncoded: encodeSchema(typed.schema.schema),
            schema: typed.schema.schema,
            data: encodeAttestData(typed.data.body, typed.schema.schema),
            expiriable: typed.data.expiriable
        }))
    );

    return keys.reduce(
        (acc, key, index) => ({ ...acc, [key]: values[index] }),
        {}
    );
};
//////////////////////////////////////////////////////////////////////////////////////////////////////
//Dynamic attestations data
const medicalTestClaim = {
    key: "Медицинское исследование на COVID-19",
    body: [
        {
            data: "2023-06-28",
            typeName: "string",
            name: "Дата проведения"
        },
        {
            data: false,
            typeName: "bool",
            name: "Результат"
        }
    ],
    expiriable: true
};

const taskClaim = {
    key: "Задание на разработку сайта",
    body: [
        {
            data: 1000,
            typeName: "uint256",
            name: "Стоимость"
        },
        {
            data: true,
            typeName: "bool",
            name: "Статус"
        }
    ],
    expiriable: false
};

const awardClaim = {
    key: "Конкурс блогеров года",
    body: [
        {
            data: 1,
            typeName: "uint8",
            name: "Занятое место"
        },
        {
            data: 2023,
            typeName: "uint16",
            name: "Год"
        },
        {
            data: 5000,
            typeName: "uint256",
            name: "Призовой фонд"
        }
    ],
    expiriable: false
};

export const getSynteticDynamicData = () =>
    [medicalTestClaim, taskClaim, awardClaim].map((claim) => ({
        key: claim.key,
        body: claim.body.map((elem) => ({
            ...elem,
            data: defaultAbiCoder.encode([elem.typeName], [elem.data])
        })),
        expiriable: claim.expiriable
    }));
