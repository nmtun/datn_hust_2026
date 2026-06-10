# Cac diem an tuong cua du an (ban chi tiet de viet bao cao)

Tai lieu nay tong hop 5 diem nhan ky thuat cua du an theo cau truc:

- Van de
- Giai phap
- Ket qua

Ban nay duoc viet theo huong co the dua truc tiep vao bao cao tot nghiep, sau do bo sung so lieu thuc te.

---

## 1) Xay dung co che co lap du lieu doanh nghiep dua tren request context

### Van de
- Du an phuc vu nhieu doanh nghiep tren cung mot he thong, nen moi truy van khong duoc rang buoc tenant scope deu co nguy co lo du lieu cheo tenant.
- O giai doan dau, logic xu ly tenant de bi phan tan theo tung controller, gay kho cho kiem soat dong bo khi so module tang nhanh.
- Cac luong tao du lieu moi (candidate, task, training material, quiz result...) neu bo sot tenant_id se tao du lieu "mo coi" va kho truy vet.
- Trong boi canh co nhieu role (admin, HR, manager, employee), ranh gioi giua authorization va data isolation neu khong duoc thiet ke ro rang de gay nham lan.

### Giai phap
- Chuan hoa request context ngay sau xac thuc:
  - Tach buoc xac thuc token va buoc trich xuat tenant context.
  - Gan tenant context vao request lifecycle de tat ca service co the su dung thong nhat.
- Ap dung nguyen tac "tenant-first" trong service layer:
  - Moi truy van doc phai co dieu kien tenant_id.
  - Moi truy van ghi phai duoc bom tenant_id tu request context, khong cho phep client tu truyen tenant_id tuy y.
- Chuan hoa helper va middleware:
  - Tao helper lay tenant bat buoc (vi du requireTenantId) de fail-fast khi request khong co context hop le.
  - Dua quy tac check tenant vao mot diem tap trung thay vi lap lai tai moi endpoint.
- Thiet ke model va association theo huong da tenant:
  - Cac bang cot loi (users, departments, teams, projects, tasks, candidates, materials, quizzes...) deu co tenant_id.
  - Moi lien ket giua cac bang quan trong deu duoc xem xet kha nang truy van cheo tenant va khoa bang dieu kien tenant scope.
- Chien luoc kiem thu:
  - Tao bo test case theo cap "hop le" va "xam pham tenant".
  - Test API voi token tenant A nhung id du lieu tenant B de dam bao he thong tu choi.

### Ket qua
- Tao duoc lop bao ve du lieu co he thong, giam manh rui ro lo du lieu cheo tenant.
- Don gian hoa mo rong module moi vi quy tac tenant da tro thanh "mac dinh ky thuat" cua du an.
- Giam chi phi bao tri: logic tenant duoc tap trung hoa, de review, de test, de audit.
- Tang do tin cay khi demo voi doanh nghiep vi co the trinh bay ro co che data isolation.
- KPI/so lieu nen bo sung vao bao cao:
  - Ty le endpoint da ap dung day du tenant scope.
  - So testcase "cross-tenant access" dat/khong dat theo tung release.
  - So loi lien quan data isolation truoc va sau khi chuan hoa request context.

---

## 2) Xay dung quy trinh tuyen dung toan dien

### Van de
- Quy trinh tuyen dung truoc day bi cat khuc theo tung cong doan: dang tin, nhan CV, loc ho so, phan cong phong van, danh gia ket qua.
- Du lieu candidate va job description khong lien ket chat, gay kho cho theo doi pipeline va thong ke hieu suat tuyen dung.
- Team HR va manager de bi "mat trang thai" ung vien, vi viec cap nhat thu cong bang file/tin nhan.
- Khong co co che thong bao dong bo theo su kien, gay tre trong viec phan hoi ung vien.

### Giai phap
- Mo hinh hoa quy trinh nghiep vu thanh he thong du lieu co cau truc:
  - Job Description: quan ly nhu cau tuyen dung theo phong ban/vi tri/trang thai.
  - Candidate: quan ly ho so ung vien, nguon ung vien, ngay nop ho so, trang thai xu ly.
  - Nguoi phu trach: lien ket vai tro HR/manager vao cac buoc xu ly.
- Chuan hoa vong doi trang thai ung vien:
  - Tu tiep nhan -> so tuyen -> phong van -> danh gia -> de nghi/tu choi.
  - Moi buoc co dieu kien chuyen trang thai ro rang de tranh thao tac "nhay buoc".
- Tich hop thong bao theo su kien:
  - Khi co thay doi trang thai, he thong tao thong bao toi doi tuong lien quan.
  - Giam phu thuoc vao nhac viec thu cong qua chat/email rieng le.
- To chuc API theo module tuyen dung:
  - Tach ro endpoint cho job va candidate.
  - De mo rong tinh nang sau nay nhu scoring, lich phong van, report funnel.

### Ket qua
- Hoan thien luong tuyen dung end-to-end tren mot he thong, giam phan tan cong cu.
- Minh bach hoa tien do xu ly ung vien theo tung vi tri va tung phong ban.
- Tao nen du lieu sach, co the dung de phan tich funnel tuyen dung va chat luong kenh ung vien.
- Tang toc do phoi hop giua HR va manager do thong tin duoc cap nhat theo su kien.
- KPI/so lieu nen bo sung vao bao cao:
  - Time-to-hire trung binh truoc/sau khi ap dung he thong.
  - Ty le candidate duoc cap nhat trang thai dung SLA.
  - Ty le roi pipeline theo tung giai doan (funnel conversion).
  - So gio xu ly thu cong tiet kiem duoc moi dot tuyen dung.

---

## 3) Xay dung quy trinh quan ly tai lieu ket hop dao tao

### Van de
- Tai lieu noi bo truoc day luu phan tan o nhieu kenh, kho tim kiem va kho kiem soat phien ban.
- Qua trinh dao tao thieu lien ket giua "hoc lieu" va "kiem tra", dan den kho danh gia muc do tiep thu.
- Khong co du lieu tien trinh hoc tap theo phong ban/nhom nhan su de ho tro quan ly nang luc.
- Noi dung dao tao de bi trung lap, kho tai su dung do thieu he thong tag va mapping noi dung.

### Giai phap
- Xay dung module quan ly training materials:
  - Cho phep upload, luu tru, quan ly metadata tai lieu.
  - Gan tag de phan loai theo chu de, ky nang, cap do.
- Thiet ke lien ket tai lieu voi quiz:
  - Mapping many-to-many giua materials va quizzes.
  - Moi hoc lieu co the gan 1..n bai quiz danh gia.
- Xay dung module quiz day du:
  - Quan ly cau hoi, dap an, bo quiz, ket qua lam bai.
  - Luu lich su lam bai de theo doi tien bo theo thoi gian.
- Theo doi hoc tap theo tenant:
  - Tat ca training records/quiz results deu duoc scope theo tenant.
  - Ho tro thong ke theo phong ban, team, nhom ky nang.
- Chien luoc mo rong:
  - San sang de bo sung learning path, prerequisite, va recommendation noi dung.

### Ket qua
- Chuyen doi tu kho tai lieu thu dong sang he sinh thai hoc tap co cau truc.
- Tang kha nang tim lai va tai su dung noi dung dao tao nhieu lan, nhieu bo phan.
- Co co so du lieu danh gia nang luc dau vao/dau ra qua quiz result.
- Ho tro nha quan ly ra quyet dinh dao tao dua tren du lieu thay vi cam tinh.
- KPI/so lieu nen bo sung vao bao cao:
  - Ty le nhan vien hoan thanh hoc lieu theo thang/quy.
  - Ty le hoan thanh quiz sau khi hoc tai lieu.
  - Diem trung binh va muc tang diem qua cac lan dao tao.
  - So tai lieu duoc tai su dung boi nhieu phong ban.

---

## 4) Xay dung career-portal phuc vu da khach hang dua tren subdomain

### Van de
- Du an can mo hinh "mot nen tang - nhieu doanh nghiep", trong do moi doanh nghiep can trang tuyen dung rieng theo nhan dien thuong hieu.
- Neu khong dung subdomain tenant-aware, viec phan tach noi dung va luong nop CV se de nham lan du lieu giua cac doanh nghiep.
- Van de kho nhat la can bang giua tinh rieng theo tenant va kha nang tai su dung chung codebase.

### Giai phap
- Xay dung career-portal tach rieng voi kien truc huong da tenant:
  - Nhan dien tenant tu subdomain.
  - Nap cau hinh/noi dung theo tenant context ngay tu tang public.
- Chuan hoa route va API ket noi:
  - Danh sach job hien thi theo tenant.
  - Luong apply gui dung ve tenant va vi tri tuong ung.
- Ap dung validation chat cho ho so ung tuyen:
  - Kiem tra truong bat buoc, file CV, thong tin lien he.
  - Dam bao du lieu nap vao he thong co chat luong va de xu ly tiep.
- To chuc van hanh theo huong "scale-out tenant":
  - Them tenant moi chu yeu qua cau hinh subdomain + bo du lieu.
  - Han che can thiep code khi onboarding khach hang moi.

### Ket qua
- Moi doanh nghiep co cong tuyen dung rieng ma van dung chung mot nen tang ky thuat.
- Nang cao trai nghiem ung vien do thong tin duoc ca nhan hoa theo thuong hieu doanh nghiep.
- Giam chi phi van hanh va bao tri so voi mo hinh trien khai rieng tung he thong.
- Tao loi the san pham: mo rong nhanh so luong khach hang ma khong tang tuong ung chi phi phat trien.
- KPI/so lieu nen bo sung vao bao cao:
  - So tenant dang van hanh tren career-portal.
  - Thoi gian trung binh onboarding tenant moi.
  - So luong CV nhan duoc theo tenant/theo thang.
  - Ty le apply thanh cong (submit success rate).

---

## 5) Xay dung quy trinh trien khai he thong da moi truong

### Van de
- He thong gom nhieu thanh phan (back-end, front-end quan tri, career-portal, landing-page), moi thanh phan co bien moi truong va quy trinh build rieng.
- Trien khai thu cong de phat sinh sai sot cau hinh (sai env, sai endpoint, sai thu tu service).
- Khac biet giua dev/staging/production neu khong duoc tieu chuan hoa se gay loi kho tai hien.

### Giai phap
- Chuan hoa quy trinh deploy bang script va config:
  - Su dung docker-compose cho boi canh dong goi service.
  - Su dung ecosystem config de quan ly process backend.
- Tach bien moi truong theo tung service va tung moi truong:
  - Quy uoc ten bien nhat quan.
  - Tranh hard-code thong so nhay cam trong ma nguon.
- Chuan hoa pipeline build/run:
  - Xac dinh ro thu tu khoi tao dich vu phu thuoc.
  - Co checklist truoc/sau deploy de kiem soat chat luong ban phat hanh.
- Chuan hoa tai lieu van hanh:
  - Huong dan khoi chay local/dev.
  - Huong dan rollback, backup, kiem tra health sau deploy.

### Ket qua
- Tang tinh on dinh va kha nang lap lai cua quy trinh phat hanh.
- Giam loi cau hinh do thao tac tay, de mo rong doi ngu van hanh.
- Rut ngan lead time dua tinh nang moi len moi truong chay that.
- Cai thien kha nang quan sat va xu ly su co vi quy trinh da duoc tieu chuan hoa.
- KPI/so lieu nen bo sung vao bao cao:
  - Deployment frequency va lead time moi release.
  - Ty le deploy thanh cong ngay lan dau (first-time success rate).
  - MTTR (mean time to recovery) khi co su co.
  - So su co lien quan cau hinh truoc/sau chuan hoa.

---

## Khung viet nhanh cho bao cao (goi y copy vao chuong ket qua)

Ban co the su dung mau ngan gon sau cho moi muc:

1. Boi canh va van de
- He thong gap van de gi?
- Tac dong cua van de den nghiep vu va ky thuat?

2. Giai phap thiet ke va trien khai
- Kien truc duoc chon la gi va vi sao?
- Da thay doi gi trong model/API/quy trinh?
- Da kiem thu va xac thuc giai phap ra sao?

3. Ket qua dat duoc
- Loi ich nghiep vu cu the?
- Loi ich ky thuat cu the?
- So lieu truoc/sau de chung minh hieu qua?

4. Danh gia va huong mo rong
- Gioi han hien tai la gi?
- Buoc nang cap tiep theo la gi?

---

## Ghi chu quan trong khi nop bao cao

- Neu chua co day du so lieu production, co the dung so lieu tu staging/UAT nhung can ghi ro nguon.
- Uu tien trinh bay theo kieu "truoc -> can thiep -> sau" de tang tinh thuyet phuc.
- Moi ket qua nen co it nhat 1 bang so lieu hoac 1 bieu do minh hoa.
- Nen kem 1 phu luc mo ta API tieu bieu va 1 phu luc mo ta schema du lieu theo module.
