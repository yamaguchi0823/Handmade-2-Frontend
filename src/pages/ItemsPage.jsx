import PageHeader from "../components/PageHeader";
import ItemPanel from "../components/ItemsPanel";

export default function ItemsPage(){
    return(
        <div>
            <h2 className="h4 mb-2">作品管理</h2>
            <p className="text-secondary mb-0">
                作品とバリエーションの登録・編集を行います。
            </p>
            <ItemPanel />
        </div>
    );

}