import * as functions from "firebase-functions";
import {Request, Response} from "express";
import {logger} from "firebase-functions";

import express = require("express");
import cors = require("cors");

const app = express();
import bodyParser = require("body-parser");
import {load} from "cheerio";
import axios from "axios";
// Parse Query String
app.use(bodyParser.urlencoded({extended: false}));

// Parse posted JSON body
app.use(bodyParser.json());

// Automatically allow cross-origin requests
app.use(cors({origin: true}));

// build multiple CRUD interfaces:
app.get("/", (req: Request, res: Response) => res.send("Api SICM"));


app.get("/sicm", function(req: Request, res: Response) {
  (async () => {
    const min = Number(req.query.min);
    const max = Number(req.query.max);
    const diff = max - min;
    const result: SicmData[] = [];
    for (let i = 0; i <= diff; i++) {
      const data = await getData(min, i);
      result.push(data);
    }
    res.send({
      success: true,
      message: "Data",
      data: result,
    });
  })();
});

async function getData(min: number, i: number): Promise<SicmData> {
  try {
    const guid = min + i;
    const url = "http://www.sicm.gob.ve/g_4cguia.php?id_guia="+ guid;
    const response = await axios.get(url);
    const body = response.data;
    const $ = load(body);
    const cod = $(
        "body > table > tbody > tr:nth-child(3) > td >"+
        "table > tbody > tr:nth-child(1) > td.texto12"
    ).text();
    const status = $(
        "body > table > tbody > tr:nth-child(3) > td >"+
        "table > tbody > tr:nth-child(2) > td:nth-child(1)"
    ).text();
    const createdAt = $(
        "body > table > tbody > tr:nth-child(3) > td >"+
        "table > tbody > tr:nth-child(3) > td"
    ).text();
    const expirationDate = $(
        "body > table > tbody > tr:nth-child(3) > td >"+
        "table > tbody > tr:nth-child(4) > td"
    ).text();
    const documents = $(
        "body > table > tbody > tr:nth-child(3) > td >"+
        "table > tbody > tr:nth-child(5) > td"
    ).text();
    return {
      codGuide: cod.split(":")[1].trim(),
      status: status.split("(")[1].split(")")[0].trim(),
      createdAt: createdAt.split(":")[1].split(" ")[1].trim(),
      expirationDate: expirationDate.split(":")[1].trim(),
      documents: documents,
    };
  } catch (error) {
    logger.error(error);
    return {};
  }
}

export const api = functions.https.onRequest(app);

export interface SicmData {
  codGuide?: string | null;
  status?: string | null;
  createdAt?: string | null;
  expirationDate?: string | null;
  documents?: string | null;
}
