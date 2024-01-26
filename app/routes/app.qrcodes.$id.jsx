import { useState } from "react";
import { json, redirect } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  useNavigate,
} from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Card,
  Bleed,
  Button,
  ChoiceList,
  Divider,
  EmptyState,
  InlineStack,
  InlineError,
  Layout,
  Page,
  Text,
  TextField,
  Thumbnail,
  BlockStack,
  PageActions,
} from "@shopify/polaris";
import { ImageMajor } from "@shopify/polaris-icons";

import db from "../db.server";
import { getQRCode, validateQRCode } from "../models/QRCode.server";

export async function loader({ request, params }) {
    const { admin } = await authenticate.admin(request);
  
    if (params.id === "new") {
      return json({
        destination: "product",
        title: "",
      });
    }
  
    return json(await getQRCode(Number(params.id), admin.graphql));
  }

  export async function action({ request, params }) {
    const { session } = await authenticate.admin(request);
    const { shop } = session;
  
    /** @type {any} */
    const data = {
      ...Object.fromEntries(await request.formData()),
      shop,
    };
  
    if (data.action === "delete") {
      await db.qRCode.delete({ where: { id: Number(params.id) } });
      return redirect("/app");
    }
  
    const errors = validateQRCode(data);
  
    if (errors) {
      return json({ errors }, { status: 422 });
    }
  
    const qrCode =
      params.id === "new"
        ? await db.qRCode.create({ data })
        : await db.qRCode.update({ where: { id: Number(params.id) }, data });
  
    return redirect(`/app/qrcodes/${qrCode.id}`);
  }
  