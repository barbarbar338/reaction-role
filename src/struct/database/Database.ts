import { IMessageData } from "reaction-role";
import { RRRepository } from "./RRModel";

export class Database {
    public static async createMessage(
        data: IMessageData,
    ): Promise<IMessageData> {
        const isExists = await RRRepository.findOne({
            messageID: data.messageID,
        });
        if (isExists) {
            return await RRRepository.updateOne(
                {
                    messageID: data.messageID,
                },
                data,
            );
        } else {
            return await RRRepository.create(data);
        }
    }
    public static async deleteMessage(
        messageID: string,
    ): Promise<
        { ok?: number | undefined; n?: number | undefined } & {
            deletedCount?: number | undefined;
        }
    > {
        return RRRepository.deleteMany({
            messageID,
        });
    }
}
